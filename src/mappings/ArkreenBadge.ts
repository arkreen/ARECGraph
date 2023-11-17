/* eslint-disable prefer-const */
import { Address } from '@graphprotocol/graph-ts'
import { OffsetCertificateMinted, OffsetCertificateUpdated, OffsetAttached, ArkreenBadge } from '../types/ArkreenBadge/ArkreenBadge'
import { ARECBadge, ClimateAction, ARECOverview, ARTOverview } from '../types/schema'
import { ZERO_BI, ADDRESS_AREC_BADGE } from './ArkreenRECIssuance'

// event OffsetCertificateMinted(uint256 tokenId)
export function handleOffsetCertificateMinted(event: OffsetCertificateMinted): void {
  
  let arkreenBadge = ArkreenBadge.bind(Address.fromString(ADDRESS_AREC_BADGE))
  let arecBadgeInfo = arkreenBadge.getCertificate(event.params.tokenId)

  let arecBadge = new ARECBadge("AREC_Badge_" + event.params.tokenId.toString().padStart(6,'0'))
  arecBadge.offsetEntity = arecBadgeInfo.offsetEntity
  arecBadge.beneficiary = arecBadgeInfo.beneficiary
  arecBadge.offsetEntityID = arecBadgeInfo.offsetEntityID
  arecBadge.beneficiaryID = arecBadgeInfo.beneficiaryID
  arecBadge.offsetMessage = arecBadgeInfo.offsetMessage
  arecBadge.creationTime = arecBadgeInfo.creationTime.toI32()
  arecBadge.offsetTotalAmount = arecBadgeInfo.offsetTotalAmount
  arecBadge.offsetIds = arecBadgeInfo.offsetIds
  arecBadge.save()

  let numActions = arecBadgeInfo.offsetIds.length
  for (let index = 0; index < numActions; index++) {
    let climateAction = ClimateAction.load("Action_" + arecBadgeInfo.offsetIds[index].toString().padStart(6,'0'))!
    climateAction.bClaimed = true
    climateAction.save()

    let artOverview = ARTOverview.load(climateAction.ARTAsset)!
    artOverview.numOffsetClaimed = artOverview.numOffsetClaimed + 1
    artOverview.amountARTOffsetClaimed = artOverview.amountARTOffsetClaimed.plus(climateAction.amount)
    artOverview.save()
  }

  let arecOverview = ARECOverview.load("AREC_VIEW")!
  arecOverview.numClimateBadge = arecOverview.numClimateBadge + 1
  arecOverview.numClimateActionClaimed = arecOverview.numClimateActionClaimed + arecBadgeInfo.offsetIds.length
  arecOverview.amountARECOffsetClaimed = arecOverview.amountARECOffsetClaimed.plus(arecBadgeInfo.offsetTotalAmount)
  arecOverview.save()

}

// event OffsetCertificateUpdated(uint256 tokenId)
export function handleOffsetCertificateUpdated(event: OffsetCertificateUpdated): void {

  let arecBadge = ARECBadge.load("AREC_Badge_" + event.params.tokenId.toString().padStart(6,'0'))!

  let arkreenBadge = ArkreenBadge.bind(Address.fromString(ADDRESS_AREC_BADGE))
  let arecBadgeInfo = arkreenBadge.getCertificate(event.params.tokenId)

  arecBadge.beneficiary = arecBadgeInfo.beneficiary
  arecBadge.offsetEntityID = arecBadgeInfo.offsetEntityID
  arecBadge.beneficiaryID = arecBadgeInfo.beneficiaryID
  arecBadge.offsetMessage = arecBadgeInfo.offsetMessage

  arecBadge.save()
}

// event OffsetAttached(uint256 tokenId, uint256[] offsetIds)
export function handleOffsetAttached(event: OffsetAttached): void {
/*  
  let callData = ethereum.decode('(uint256,uint256[])', 
                                  Bytes.fromHexString('0x0000000000000000000000000000000000000000000000000000000000000020' +
                                                      event.transaction.input.toHexString().slice(10)))

  let offsetIds = changetype<BigInt[]>(callData!.toTuple()[1])
*/
  let offsetIds = event.params.offsetIds
  let arkreenBadge = ArkreenBadge.bind(Address.fromString(ADDRESS_AREC_BADGE))

  let numActions = offsetIds.length
  let offsetTotalAmountAttached = ZERO_BI
  for (let index = 0; index < numActions; index++) {
    let climateAction  = ClimateAction.load("Action_" + offsetIds[index].toString().padStart(6,'0'))!
    let actionInfo = arkreenBadge.getOffsetActions(offsetIds[index])
    offsetTotalAmountAttached = offsetTotalAmountAttached.plus(actionInfo.amount)
    climateAction.bClaimed = actionInfo.bClaimed
    climateAction.save()

    let artOverview = ARTOverview.load(climateAction.ARTAsset)!
    artOverview.numOffsetClaimed = artOverview.numOffsetClaimed + 1
    artOverview.amountARTOffsetClaimed = artOverview.amountARTOffsetClaimed.plus(climateAction.amount)
    artOverview.save()
  }

  let arecBadge = ARECBadge.load("AREC_Badge_" + event.params.tokenId.toString().padStart(6,'0'))!
  arecBadge.offsetIds = arecBadge.offsetIds.concat(offsetIds)
  arecBadge.offsetTotalAmount = arecBadge.offsetTotalAmount.plus(offsetTotalAmountAttached)
  arecBadge.save()

  let arecOverview = ARECOverview.load("AREC_VIEW")!
  arecOverview.numClimateActionClaimed = arecOverview.numClimateActionClaimed + offsetIds.length
  arecOverview.amountARECOffsetClaimed = arecOverview.amountARECOffsetClaimed.plus(offsetTotalAmountAttached)
  arecOverview.save()
}