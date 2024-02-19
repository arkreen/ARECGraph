/* eslint-disable prefer-const */
import { tAKREOverview, tAKREHolder } from '../types/schema'
import { Transfer } from '../types/tAKRE/ArkreenToken'
import { ADDRESS_ZERO, ZERO_BI } from './ArkreenRECIssuance'

export const SNAPSHOT_TIME = 1709078400

// event: Transfer(indexed address from,indexed address to,uint256 value)
export function handleTAKERTransfer(event: Transfer): void {
  let takreOverview = tAKREOverview.load("tAKRE")
  if (takreOverview === null) {
    takreOverview = new tAKREOverview("tAKRE")
    takreOverview.numHolders = 0
    takreOverview.totalSupply = ZERO_BI
    takreOverview.totalMinted = ZERO_BI
    takreOverview.totalBurned = ZERO_BI
    takreOverview.save()
  }

  if (event.params.from.toHexString() == ADDRESS_ZERO) {
    takreOverview.totalMinted = takreOverview.totalMinted.plus(event.params.value)
    takreOverview.totalSupply = takreOverview.totalSupply.plus(event.params.value)
    takreOverview.save()
  } else {
    let tkreEHolder = tAKREHolder.load(event.params.from.toHexString())!
    tkreEHolder.amountARKE = tkreEHolder.amountARKE.minus(event.params.value)
    if (event.block.timestamp.toI32() < SNAPSHOT_TIME) {
      tkreEHolder.amountSnapshot = tkreEHolder.amountARKE
    }
    tkreEHolder.save()
  }

  if (event.params.to.toHexString() == ADDRESS_ZERO) {
    takreOverview.totalBurned = takreOverview.totalBurned.plus(event.params.value)
    takreOverview.totalSupply = takreOverview.totalSupply.minus(event.params.value)
    takreOverview.save()
  } else {
    let tkreEHolder = tAKREHolder.load(event.params.to.toHexString())
    if (tkreEHolder === null) {
      tkreEHolder = new tAKREHolder(event.params.to.toHexString())
      tkreEHolder.amountARKE = ZERO_BI
      tkreEHolder.amountSnapshot = ZERO_BI
      tkreEHolder.save()
    } 
    tkreEHolder.amountARKE = tkreEHolder.amountARKE.plus(event.params.value)
    if (event.block.timestamp.toI32() < SNAPSHOT_TIME) {
      tkreEHolder.amountSnapshot = tkreEHolder.amountARKE
    }
    tkreEHolder.save()
  }
}
