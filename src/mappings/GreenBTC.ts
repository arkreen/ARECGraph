/* eslint-disable prefer-const */
import { BigInt, Address, Bytes } from '@graphprotocol/graph-ts'
import { GreenBitCoin, OpenBox, RevealBoxes, Transfer, GreenBTC as GreenBTCContract } from '../types/GreenBTC/GreenBTC'
import { GreenBTCV1 as GreenBTCContractV1 } from '../types/GreenBTC/GreenBTCV1'

import { GreenBTC, GreenBTCBlock, GreenBTCUser } from '../types/schema'
import { ONE_BI, ZERO_BI, ADDRESS_ZERO } from './helpers'

const ADDRESS_GREENTBTC = '0xdf51f3dcd849f116948a5b23760b1ca0b5425bde'
const SUBSIDY_UPDATE_HEIGHT = 56415926
// const SUBSIDY_UPDATE_READY = 56752488

// event GreenBitCoin(uint256 height, uint256 ARTCount, address minter, uint8 greenType)
export function handleGreenBitCoin(event: GreenBitCoin): void {

  let greenBTC = GreenBTC.load("GREEN_BTC")
  if (greenBTC === null) {
    greenBTC = new GreenBTC("GREEN_BTC")
    greenBTC.lastBlockHeight = event.block.number
    greenBTC.bought = ZERO_BI
    greenBTC.opened = ZERO_BI
    greenBTC.revealed = ZERO_BI
    greenBTC.won = ZERO_BI
    greenBTC.amountEnergy = ZERO_BI
    greenBTC.amountWonEnergy = ZERO_BI
    greenBTC.amountARTSubsidy = ZERO_BI
    greenBTC.amountCARTSubsidy = ZERO_BI
    greenBTC.save()
  }

  let rateSubsidy = 0
  if (event.block.number.ge(BigInt.fromI32(SUBSIDY_UPDATE_HEIGHT))) {

    let greenBTCContract = GreenBTCContract.bind(Address.fromString(ADDRESS_GREENTBTC))
    let dataNFTResult = greenBTCContract.try_dataNFT(event.params.height)

    if (!dataNFTResult.reverted) {
      rateSubsidy =  dataNFTResult.value.getRatioSubsidy()
    } 
  }
  
  greenBTC.lastBlockHeight = event.block.number
  greenBTC.bought = greenBTC.bought.plus(ONE_BI)
  greenBTC.amountEnergy = greenBTC.amountEnergy.plus(event.params.ARTCount)

  if (rateSubsidy != 0) {
    let valueSubsidy = event.params.ARTCount.times(BigInt.fromI32(rateSubsidy)).div(BigInt.fromI32(100))
    if (event.params.greenType > 16) {              // ART
      greenBTC.amountARTSubsidy = greenBTC.amountARTSubsidy.plus(valueSubsidy)
    } else {                                        // CART
     greenBTC.amountCARTSubsidy = greenBTC.amountCARTSubsidy.plus(valueSubsidy)
    }
  }

  greenBTC.save()

  let greenBTCBlock = GreenBTCBlock.load("GREENBTC_BLOCK_"+ event.params.height.toString().padStart(8,'0'))
  if (greenBTCBlock === null) {
    greenBTCBlock = new GreenBTCBlock("GREENBTC_BLOCK_"+ event.params.height.toString().padStart(8,'0'))
    greenBTCBlock.lastBlockHeight = event.block.number
    greenBTCBlock.heightBTC = event.params.height
    greenBTCBlock.amountEnergy = event.params.ARTCount
    greenBTCBlock.indexBuy = greenBTC.bought
    greenBTCBlock.buyTimestamp = event.block.timestamp
    greenBTCBlock.openTimestamp = ZERO_BI
    greenBTCBlock.buyTxHash = event.transaction.hash
    greenBTCBlock.opener = Bytes.fromHexString(ADDRESS_ZERO)
    greenBTCBlock.openBlockHeight = ZERO_BI
    greenBTCBlock.minter = event.params.minter
    greenBTCBlock.owner = event.params.minter
    greenBTCBlock.greenType = event.params.greenType
    greenBTCBlock.seed = ''
    greenBTCBlock.status = "Sold"                // sold
    greenBTCBlock.subsidy = rateSubsidy
    greenBTCBlock.save()
  } else {                                        // For event OpenBox first
    greenBTCBlock.lastBlockHeight = event.block.number
    greenBTCBlock.amountEnergy = event.params.ARTCount
    greenBTCBlock.indexBuy = greenBTC.bought
    greenBTCBlock.minter = event.params.minter
    greenBTCBlock.owner = event.params.minter
    greenBTCBlock.greenType = event.params.greenType
    greenBTCBlock.subsidy = rateSubsidy
    greenBTCBlock.save()
  }

  let greenBTCUser = GreenBTCUser.load("GREENBTC_USER_" + event.params.minter.toHexString())
  if (greenBTCUser === null) {
    greenBTCUser = new GreenBTCUser("GREENBTC_USER_" + event.params.minter.toHexString())
    greenBTCUser.lastBlockHeight = event.block.number
    greenBTCUser.balanceGBC = ZERO_BI
    greenBTCUser.bought = ZERO_BI
    greenBTCUser.opened = ZERO_BI
    greenBTCUser.revealed = ZERO_BI
    greenBTCUser.won = ZERO_BI
    greenBTCUser.amountEnergy = ZERO_BI
    greenBTCUser.amountBoughtEnergy = ZERO_BI
    greenBTCUser.amountWonEnergy = ZERO_BI
    // greenBTCUser.greenBTCBlockList = []
    greenBTCUser.save()
  }

  greenBTCUser.bought = greenBTCUser.bought.plus(ONE_BI)
  greenBTCUser.amountBoughtEnergy = greenBTCUser.amountBoughtEnergy.plus(event.params.ARTCount)
  greenBTCUser.balanceGBC = greenBTCUser.balanceGBC.plus(ONE_BI)
  greenBTCUser.amountEnergy = greenBTCUser.amountEnergy.plus(event.params.ARTCount)
  
  // let greenBTCBlockList = greenBTCUser.greenBTCBlockList
  // greenBTCBlockList.push(greenBTCBlock.id)
  // greenBTCUser.greenBTCBlockList = greenBTCBlockList
  greenBTCUser.lastBlockHeight = event.block.number
  greenBTCUser.save()
}

// event OpenBox(address opener, uint256 tokenID, uint256 blockNumber)
export function handleOpenBox(event: OpenBox): void {
  let greenBTCBlock = GreenBTCBlock.load("GREENBTC_BLOCK_"+ event.params.tokenID.toString().padStart(8,'0'))
  if (greenBTCBlock === null) {                 // For event OpenBox first
    greenBTCBlock = new GreenBTCBlock("GREENBTC_BLOCK_"+ event.params.tokenID.toString().padStart(8,'0'))
    greenBTCBlock.lastBlockHeight = event.block.number
    greenBTCBlock.heightBTC = event.params.tokenID
    greenBTCBlock.amountEnergy = ZERO_BI
    greenBTCBlock.indexBuy = ZERO_BI
    greenBTCBlock.buyTimestamp = event.block.timestamp
    greenBTCBlock.openTimestamp = event.block.timestamp
    greenBTCBlock.buyTxHash = event.transaction.hash
    greenBTCBlock.opener = event.params.opener
    greenBTCBlock.openBlockHeight = event.params.blockNumber
    greenBTCBlock.minter = Bytes.fromHexString(ADDRESS_ZERO)
    greenBTCBlock.owner = Bytes.fromHexString(ADDRESS_ZERO)
    greenBTCBlock.greenType = 0
    greenBTCBlock.seed = ''
    greenBTCBlock.status = "Opened"              // opened
    greenBTCBlock.subsidy = 0
    greenBTCBlock.save()
  } else {
    greenBTCBlock.lastBlockHeight = event.block.number
    greenBTCBlock.opener = event.params.opener
    greenBTCBlock.openBlockHeight = event.params.blockNumber
    greenBTCBlock.openTimestamp = event.block.timestamp
    greenBTCBlock.status = "Opened"              // opened
    greenBTCBlock.save()
  }

  let greenBTC = GreenBTC.load("GREEN_BTC")!
  greenBTC.lastBlockHeight = event.block.number
  greenBTC.opened = greenBTC.opened.plus(ONE_BI)
  greenBTC.save()

  let greenBTCUser = GreenBTCUser.load("GREENBTC_USER_" + event.params.opener.toHexString())
  if (greenBTCUser === null) {
    greenBTCUser = new GreenBTCUser("GREENBTC_USER_" + event.params.opener.toHexString())
    greenBTCUser.lastBlockHeight = event.block.number
    greenBTCUser.bought = ZERO_BI
    greenBTCUser.opened = ZERO_BI
    greenBTCUser.revealed = ZERO_BI
    greenBTCUser.won = ZERO_BI
    greenBTCUser.amountEnergy = ZERO_BI
    greenBTCUser.amountBoughtEnergy = ZERO_BI
    greenBTCUser.amountWonEnergy = ZERO_BI
    // greenBTCUser.greenBTCBlockList = []
    greenBTCUser.save()
  }
  greenBTCUser.lastBlockHeight = event.block.number
  greenBTCUser.opened = greenBTCUser.opened.plus(ONE_BI)
  greenBTCUser.save()
}

// event RevealBoxes(uint256[] revealList, bool[] wonList)
export function handleRevealBoxes(event: RevealBoxes): void {

  let revealList = event.params.revealList
  let wonList = event.params.wonList

  let greenBTC = GreenBTC.load("GREEN_BTC")!

  for (let index = 0; index < revealList.length; index++) {
    let greenBTCBlock = GreenBTCBlock.load("GREENBTC_BLOCK_"+ revealList[index].toString().padStart(8,'0'))!

    let seed: string
    if (event.block.number.lt(BigInt.fromI32(SUBSIDY_UPDATE_HEIGHT))) {
      let greenBTCContractV1 = GreenBTCContractV1.bind(Address.fromString(ADDRESS_GREENTBTC))
      let dataNFT = greenBTCContractV1.dataNFT(revealList[index])
      seed = dataNFT.value5.toHexString()
    } else {
      let greenBTCContract = GreenBTCContract.bind(Address.fromString(ADDRESS_GREENTBTC))
      let dataNFTResult = greenBTCContract.try_dataNFT(revealList[index])

      if (!dataNFTResult.reverted) {
        seed = dataNFTResult.value.value6.toHexString()
      } else {
        let greenBTCContractV1 = GreenBTCContractV1.bind(Address.fromString(ADDRESS_GREENTBTC))
        let dataNFT = greenBTCContractV1.dataNFT(revealList[index])
        seed = dataNFT.value5.toHexString()
      }
    }

    greenBTCBlock.lastBlockHeight = event.block.number
    greenBTCBlock.seed = seed
    greenBTCBlock.status = wonList[index] ? "Lucky" : "Revealed"              
    greenBTCBlock.save() 

    if (wonList[index]) {
      greenBTC.won = greenBTC.won.plus(ONE_BI)
      greenBTC.amountWonEnergy = greenBTC.amountWonEnergy.plus(greenBTCBlock.amountEnergy)
    }

    let greenBTCUser = GreenBTCUser.load("GREENBTC_USER_" + greenBTCBlock.opener.toHexString())!

    greenBTCUser.revealed = greenBTCUser.revealed.plus(ONE_BI)
    if (wonList[index]) {
      greenBTCUser.won = greenBTCUser.won.plus(ONE_BI)
      greenBTCUser.amountWonEnergy = greenBTCUser.amountWonEnergy.plus(greenBTCBlock.amountEnergy)
    }
    greenBTCUser.lastBlockHeight = event.block.number
    greenBTCUser.save()

   }

  greenBTC.lastBlockHeight = event.block.number
  greenBTC.revealed = greenBTC.revealed.plus(BigInt.fromI32(revealList.length))
  greenBTC.save()
}

// event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
export function handleTransfer(event: Transfer): void {

  if (event.params.from.toHexString() != ADDRESS_ZERO) {
    let greenBTCBlock = GreenBTCBlock.load("GREENBTC_BLOCK_"+ event.params.tokenId.toString().padStart(8,'0'))!
    greenBTCBlock.lastBlockHeight = event.block.number
    greenBTCBlock.owner = event.params.to
    greenBTCBlock.save()

    let greenBTCUserFrom = GreenBTCUser.load("GREENBTC_USER_" + event.params.from.toHexString())!

    let greenBTCUserTo = GreenBTCUser.load("GREENBTC_USER_" + event.params.to.toHexString())
    if (greenBTCUserTo === null) {
      greenBTCUserTo = new GreenBTCUser("GREENBTC_USER_" + event.params.to.toHexString())
      greenBTCUserTo.lastBlockHeight = event.block.number
      greenBTCUserTo.balanceGBC = ZERO_BI
      greenBTCUserTo.bought = ZERO_BI
      greenBTCUserTo.opened = ZERO_BI
      greenBTCUserTo.revealed = ZERO_BI
      greenBTCUserTo.won = ZERO_BI
      greenBTCUserTo.amountEnergy = ZERO_BI
      greenBTCUserTo.amountBoughtEnergy = ZERO_BI
      greenBTCUserTo.amountWonEnergy = ZERO_BI
      greenBTCUserTo.save()
    }

    greenBTCUserFrom.balanceGBC = greenBTCUserFrom.balanceGBC.minus(ONE_BI)
    greenBTCUserTo.balanceGBC = greenBTCUserTo.balanceGBC.plus(ONE_BI)

    greenBTCUserFrom.amountEnergy =  greenBTCUserFrom.amountEnergy.minus(greenBTCBlock.amountEnergy)
    greenBTCUserTo.amountEnergy =  greenBTCUserTo.amountEnergy.plus(greenBTCBlock.amountEnergy)
    
    if (greenBTCBlock.status == "Lucky") {
      greenBTCUserFrom.won =  greenBTCUserFrom.won.minus(ONE_BI)
      greenBTCUserFrom.amountWonEnergy =  greenBTCUserFrom.amountWonEnergy.minus(greenBTCBlock.amountEnergy)

      greenBTCUserTo.won =  greenBTCUserTo.won.plus(ONE_BI)
      greenBTCUserTo.amountWonEnergy =  greenBTCUserTo.amountWonEnergy.plus(greenBTCBlock.amountEnergy)
    }

    greenBTCUserFrom.lastBlockHeight = event.block.number
    greenBTCUserFrom.save()

    greenBTCUserTo.lastBlockHeight = event.block.number
    greenBTCUserTo.save()

    let greenBTC = GreenBTC.load("GREEN_BTC")!
    greenBTC.lastBlockHeight = event.block.number
    greenBTC.save()
  }
}