/* eslint-disable prefer-const */
import { Address, BigInt, Bytes, log } from '@graphprotocol/graph-ts'
import { ARECOverview,  ARTOverview, Token, ClimateAction, OffsetDetail, ARECNFT } from '../types/schema'
import { OffsetFinished, Transfer } from '../types/templates/ArkreenRECToken/ArkreenRECToken'
import { ArkreenBadge } from '../types/templates/ArkreenRECToken/ArkreenBadge'

import { ADDRESS_ZERO, ADDRESS_AREC_BADGE } from './ArkreenRECIssuance'

export let FLAG_REDEEM_MULTI      = BigInt.fromUnsignedBytes(Bytes.fromHexString('0x00000000000000c0'))  // LSB First
export let FLAG_REDEEM_MULTI_MASK = BigInt.fromUnsignedBytes(Bytes.fromHexString('0xffffffffffffff3f'))  // LSB First

// event OffsetFinished(address indexed offsetEntity, uint256 amount, uint256 offsetId)
export function handleOffsetFinished(event: OffsetFinished): void {
  
  let artOverview = ARTOverview.load(event.address.toHexString())!

  let climateAction  = new ClimateAction("Action_" + event.params.offsetId.toString().padStart(6,'0'))

  let arkreenBadge = ArkreenBadge.bind(Address.fromString(ADDRESS_AREC_BADGE))
  let actionInfo = arkreenBadge.getOffsetActions(event.params.offsetId)

  climateAction.ARTAsset = artOverview.id
  climateAction.offsetEntity = actionInfo.offsetEntity
  climateAction.issuerREC = actionInfo.issuerREC
  climateAction.amount = actionInfo.amount
  
  let offsetDetailId = actionInfo.tokenId.bitAnd(FLAG_REDEEM_MULTI_MASK)

  if (actionInfo.tokenId.bitAnd(FLAG_REDEEM_MULTI) == FLAG_REDEEM_MULTI) {
  
    // let offsetDetailInfoResult = arkreenBadge.try_getOffsetDetails(offsetDetailId)
    // let offsetDetailInfo = arkreenBadge.getOffsetDetails(offsetDetailId), reverted
    // getOffsetDetails, try_getOffsetDetails always reverted, so use this workaround as this 

    let allTokenIds = new Array<string>(0)
    let allAmounts  = new Array<BigInt>(0)
    let index = 0

    while(true) {
      let offsetDetailInfoResult = arkreenBadge.try_OffsetDetails(offsetDetailId, BigInt.fromI32(index))
      if (offsetDetailInfoResult.reverted) break
      let offsetDetailInfo = offsetDetailInfoResult.value

      allTokenIds.push('AREC_NFT_' + offsetDetailInfo.value0.toString().padStart(6,'0'))
      allAmounts.push(offsetDetailInfo.value1)
      index = index + 1
    }

    let offsetDetail = new OffsetDetail("Offset_Detail_" + offsetDetailId.toString().padStart(6,'0'))
    offsetDetail.arecNFTList = allTokenIds
    offsetDetail.amountList = allAmounts
    offsetDetail.save()

    climateAction.actionType = 'Offset_Multi'
    climateAction.offsetDetail = offsetDetail.id

  } else {
    climateAction.actionType = 'Offset'
    let areNFT = ARECNFT.load("AREC_NFT_" + offsetDetailId.toString().padStart(6,'0'))!
    climateAction.arecNFTRetired = areNFT.id
  }

  climateAction.createdAt = actionInfo.createdAt.toI32()
  climateAction.bClaimed = actionInfo.bClaimed
  climateAction.save()

  artOverview.numOffsetAction = artOverview.numOffsetAction + 1
  artOverview.amountARTOffset = artOverview.amountARTOffset.plus(event.params.amount)
  artOverview.save()

  let arecOverview = ARECOverview.load("AREC_VIEW")!
  arecOverview.amountARECOffset = arecOverview.amountARECOffset.plus(event.params.amount)
  arecOverview.numClimateAction = arecOverview.numClimateAction + 1 
  arecOverview.save()
}

// event: Transfer(indexed address from,indexed address to,uint256 value)
export function handleTransfer(event: Transfer): void {
  if (event.params.from.toHexString() == ADDRESS_ZERO) {
    let artToken = Token.load(event.address.toHexString())!
    artToken.totalSupply = artToken.totalSupply.plus(event.params.value)
    artToken.save()
  }
  if (event.params.to.toHexString() == ADDRESS_ZERO) {
    let artToken = Token.load(event.address.toHexString())!
    artToken.totalSupply = artToken.totalSupply.minus(event.params.value)
    artToken.save()
  }
}
