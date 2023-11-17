/* eslint-disable prefer-const */
import { Address } from '@graphprotocol/graph-ts'
import { ARECOverview,  ARTOverview, Token, ClimateAction } from '../types/schema'
import { OffsetFinished, Transfer } from '../types/templates/ArkreenRECToken/ArkreenRECToken'
import { ArkreenBadge } from '../types/ArkreenRECIssuance/ArkreenBadge'

import { ADDRESS_ZERO, ADDRESS_AREC_BADGE } from './ArkreenRECIssuance'

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
  climateAction.retiredtokenId = actionInfo.tokenId.toHexString()
  climateAction.createdAt = actionInfo.createdAt.toI32()
  climateAction.bClaimed = actionInfo.bClaimed
  climateAction.save()

  artOverview.numOffsetAction = artOverview.numOffsetAction + 1
  artOverview.amountARTOffset = artOverview.amountARTOffset.plus(event.params.amount)
  artOverview.save()

  let arecOverview = ARECOverview.load("AREC_VIEW")!
  arecOverview.amountARECOffset = arecOverview.amountARECOffset.plus(event.params.amount)
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
