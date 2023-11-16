/* eslint-disable prefer-const */
import { ARECOverview,  ARTOverview, ClimateAction } from '../types/schema'
import { OffsetFinished } from '../types/templates/ArkreenRECToken/ArkreenRECToken'

// event OffsetFinished(address indexed offsetEntity, uint256 amount, uint256 offsetId)
export function handleOffsetFinished(event: OffsetFinished): void {

  let artOverview = ARTOverview.load(event.address.toHexString())!
  artOverview.numNFTLiquidized = artOverview.numNFTLiquidized + 1
  artOverview.amountARTOffset = artOverview.amountARTOffset.plus(event.params.amount)
  artOverview.save()

  let arecOverview = ARECOverview.load("AREC_VIEW")!
  arecOverview.amountARECOffset = arecOverview.amountARECOffset.plus(event.params.amount)
  arecOverview.save()
}