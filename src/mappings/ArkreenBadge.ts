/* eslint-disable prefer-const */
import { ethereum, Bytes, BigInt, log, Address } from '@graphprotocol/graph-ts'
import { OffsetCertificateMinted, OffsetCertificateUpdated, OffsetAttached, ArkreenBadge } from '../types/ArkreenBadge/ArkreenBadge'

import { ARECBadge, ClimateAction } from '../types/schema'

const ADDRESS_AREC_BADGE  = '0xb17facaca106fb3d216923db6cabfc7c0517029d'

// event OffsetCertificateMinted(uint256 tokenId)
export function handleOffsetCertificateMinted(event: OffsetCertificateMinted): void {

  let arecBadge = new ARECBadge("AREC_Badge_" + event.params.tokenId.toString().padStart(6,'0'))

  let arkreenBadge = ArkreenBadge.bind(Address.fromString(ADDRESS_AREC_BADGE))
  let arecBadgeInfo = arkreenBadge.getCertificate(event.params.tokenId)

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
  for (let index = 0; index < numActions; numActions++) {
    let climateAction  = new ClimateAction("Action_" + arecBadgeInfo.offsetIds[index].toString().padStart(6,'0'))

    let actionInfo = arkreenBadge.getOffsetActions(arecBadgeInfo.offsetIds[index])
    climateAction.offsetEntity = actionInfo.offsetEntity
    climateAction.issuerREC = actionInfo.issuerREC
    climateAction.amount = actionInfo.amount
    climateAction.tokenId = actionInfo.tokenId
    climateAction.createdAt = actionInfo.createdAt.toI32()
    climateAction.bClaimed = actionInfo.bClaimed
    climateAction.save()
  }
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

// event OffsetAttached(uint256 tokenId)
export function handleOffsetAttached(event: OffsetAttached): void {

  let callData = ethereum.decode('(uint256,uint256[])', 
                                  Bytes.fromHexString(event.transaction.input.toHexString().slice(10)))

  let offsetIds = changetype<BigInt[]>(callData!.toTuple()[1])

  let arecBadge = ARECBadge.load("AREC_Badge_" + event.params.tokenId.toString().padStart(6,'0'))!

  let arkreenBadge = ArkreenBadge.bind(Address.fromString(ADDRESS_AREC_BADGE))
  arecBadge.offsetIds = arecBadge.offsetIds.concat(offsetIds)
  arecBadge.save()

  let numActions = offsetIds.length
  for (let index = 0; index < numActions; numActions++) {
    let climateAction  = new ClimateAction("Action_" + offsetIds[index].toString().padStart(6,'0'))

    let actionInfo = arkreenBadge.getOffsetActions(offsetIds[index])
    climateAction.offsetEntity = actionInfo.offsetEntity
    climateAction.issuerREC = actionInfo.issuerREC
    climateAction.amount = actionInfo.amount
    climateAction.tokenId = actionInfo.tokenId
    climateAction.createdAt = actionInfo.createdAt.toI32()
    climateAction.bClaimed = actionInfo.bClaimed
    climateAction.save()
  }
}


