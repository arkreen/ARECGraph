/* eslint-disable prefer-const */
import { BigInt, BigDecimal, log, Address, ethereum, Bytes } from '@graphprotocol/graph-ts'
import { ARECOverview,  ARTOverview, ARECNFT, ClimateAction, ARECSnapshort, UserARECOverview } from '../types/schema'
import { AREC_ASSET, Token } from '../types/schema'

import { ArkreenRECToken as ArkreenRECTokenTemplate } from '../types/templates'

import { RECRequested, ESGBatchMinted, RECCertified, ArkreenRECIssuance } from '../types/ArkreenRECIssuance/ArkreenRECIssuance'
import { RedeemFinished, RECLiquidized, Transfer, RECRejected, RECCanceled, RECDataUpdated } from '../types/ArkreenRECIssuance/ArkreenRECIssuance'
import { ArkreenBadge, ArkreenBadge__offsetActionsResult, ArkreenBadge__getOffsetActionsResultValue0Struct } from '../types/ArkreenRECIssuance/ArkreenBadge'
import { ArkreenRegistry } from '../types/ArkreenRECIssuance/ArkreenRegistry'

import { fetchTokenSymbol, fetchTokenName, fetchTokenDecimals, fetchTokenTotalSupply, fetchTokenBalance } from './helpers'

export let ZERO_BI = BigInt.fromI32(0)
export let ONE_BI = BigInt.fromI32(1)
export let ZERO_BD = BigDecimal.fromString('0')
export let ONE_BD = BigDecimal.fromString('1')
export let BI_18 = BigInt.fromI32(18)

export const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000'
export const ADDRESS_NATIVE = '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270'
export const ADDRESS_BANK = '0xab65900A52f1DcB722CaB2e5342bB6b128630A28'     
export const ADDRESS_ART   = '0x58e4d14ccddd1e993e6368a8c5eaa290c95cafdf' 
export const ADDRESS_hART  = '0x93b3bb6c51a247a27253c33f0d0c2ff1d4343214' 
export const ADDRESS_cART  = '0x0d7899f2d36344ed21829d4ebc49cc0d335b4a06'
export const ADDRESS_REGISTRY     = '0xb17facaca106fb3d216923db6cabfc7c0517029d'
export const ADDRESS_ISSUANCE     = '0x954585adf9425f66a0a2fd8e10682eb7c4f1f1fd'   
//export const ADDRESS_AKRE         = '0x21b101f5d61a66037634f7e1beb5a733d9987d57'    // tAKRE
export const ADDRESS_AKRE         = '0xe9c21de62c5c5d0ceacce2762bf655afdceb7ab3'      // AKRE
export const ADDRESS_AREC_BADGE   = '0x1e5132495cdaBac628aB9F5c306722e33f69aa24'

export const blockMainLaunch = BigInt.fromU32(54037964)
export const blockRateChange = BigInt.fromU32(62503971)

export interface offsetActions {
  offsetEntity: Address;
  issuerREC: Address;
  amount: BigInt;
  tokenId: BigInt;
  createdAt: BigInt;
  bClaimed: boolean;
}

enum RECStatus {
  Pending,            // 0
  Rejected,           // 1
  Cancelled,          // 2
  Certified,          // 3
  Retired,            // 4
  Liquidized          // 5
}

export function checkUserARECOverview(id: string): UserARECOverview  {
  let userARECOverview = UserARECOverview.load(id)
  if (userARECOverview === null) {
    userARECOverview = new UserARECOverview(id)
    userARECOverview.numARECNFTMinted = 0
    userARECOverview.numARECNFTCertified = 0
    userARECOverview.numARECNFTRedeemed = 0
    userARECOverview.numARECNFTLiquidized = 0
    userARECOverview.numARECNFTRejected = 0
    userARECOverview.numARECNFTCancelled = 0
    userARECOverview.numARECNFTSolidified = 0
    userARECOverview.numClimateAction = 0
    userARECOverview.numClimateActionClaimed = 0
    userARECOverview.numClimateBadge = 0
    userARECOverview.amountARECNFTMinted = ZERO_BI
    userARECOverview.amountARECNFTCertified = ZERO_BI
    userARECOverview.amountARECNFTRedeemed = ZERO_BI
    userARECOverview.amountARECNFTLiquidized = ZERO_BI
    userARECOverview.amountARECNFTRejected = ZERO_BI
    userARECOverview.amountARECNFTCancelled = ZERO_BI
    userARECOverview.amountARECOffset = ZERO_BI
    userARECOverview.amountARECOffsetClaimed = ZERO_BI
    userARECOverview.amountARECSolidied = ZERO_BI
    userARECOverview.amountAKRE = ZERO_BI
   
    // userARECOverview.arecNFTListCertified = []
    // userARECOverview.climateBadgeList = []
    userARECOverview.save()
  }
  return userARECOverview
}

export function updateARECSnapshort(blocktime: BigInt): void {
  let arecOverview = ARECOverview.load("AREC_VIEW")
  if (arecOverview === null) return
  
  let timestamp = blocktime.toI32()
  let dayID = timestamp / 86400
  let dayStartTimestamp = dayID * 86400
  if (dayStartTimestamp <= arecOverview.dayStartTimestamp) return;

  let arecSnapshort = new ARECSnapshort(dayID.toString())
  arecSnapshort.numARECNFTMinted = arecOverview.numARECNFTMinted
  arecSnapshort.numARECNFTCertified = arecOverview.numARECNFTCertified
  arecSnapshort.numARECNFTRedeemed = arecOverview.numARECNFTRedeemed
  arecSnapshort.numARECNFTLiquidized = arecOverview.numARECNFTLiquidized
  arecSnapshort.numARECNFTRejected = arecOverview.numARECNFTRejected
  arecSnapshort.numARECNFTCancelled = arecOverview.numARECNFTCancelled
  arecSnapshort.numARECNFTSolidified = arecOverview.numARECNFTSolidified
  arecSnapshort.numClimateAction = arecOverview.numClimateAction
  arecSnapshort.numClimateActionClaimed = arecOverview.numClimateActionClaimed
  arecSnapshort.numClimateBadge = arecOverview.numClimateBadge
  
  arecSnapshort.amountARECNFTMinted = arecOverview.amountARECNFTMinted
  arecSnapshort.amountARECNFTCertified = arecOverview.amountARECNFTCertified
  arecSnapshort.amountARECNFTRedeemed = arecOverview.amountARECNFTRedeemed
  arecSnapshort.amountARECNFTLiquidized = arecOverview.amountARECNFTLiquidized
  arecSnapshort.amountARECNFTRejected = arecOverview.amountARECNFTRejected
  arecSnapshort.amountARECNFTCancelled = arecOverview.amountARECNFTCancelled
  arecSnapshort.amountARECOffset = arecOverview.amountARECOffset
  arecSnapshort.amountARECOffsetClaimed = arecOverview.amountARECOffsetClaimed
  arecSnapshort.amountARECSolidied = arecOverview.amountARECSolidied
  arecSnapshort.amountAKRE = arecOverview.amountAKRE

  arecSnapshort.dateTime = timestamp
  arecSnapshort.save()

  arecOverview.dayStartTimestamp = dayStartTimestamp
  arecOverview.save()
}


// event RECRequested(address owner, uint256 tokenId)
export function handleRECRequested(event: RECRequested): void {

  let arecAssetType = AREC_ASSET.load("AREC_ASSET_000")
  if (arecAssetType === null) {
    arecAssetType = new AREC_ASSET("AREC_ASSET_000")

    let arkreenRECIssuance = ArkreenRECIssuance.bind(Address.fromString(ADDRESS_ISSUANCE))

    let paymentTokenPrice: BigInt
    let paymentTokenPriceResult = arkreenRECIssuance.try_paymentTokenPrice(Address.fromString(ADDRESS_AKRE))

    if (!paymentTokenPriceResult.reverted) {
      paymentTokenPrice = paymentTokenPriceResult.value
    } else {
      paymentTokenPrice = BigInt.fromI64(100000000000)
    }

    let arkreenRegistry = ArkreenRegistry.bind(Address.fromString(ADDRESS_REGISTRY))
    arecAssetType.issuer = arkreenRegistry.tokenRECs(Address.fromString(ADDRESS_ART))

    arecAssetType.tokenREC = ADDRESS_ART
    arecAssetType.tokenPay = Address.fromString(ADDRESS_AKRE)

    // rateToIssue is low 128 bits, rateToLiquidize is high 128 bits
    arecAssetType.rateToIssue = paymentTokenPrice.leftShift(128).rightShift(128)
    arecAssetType.rateToLiquidize = paymentTokenPrice.rightShift(128)
    arecAssetType.save()

    // create ART token is necessary
    let artToken = Token.load(ADDRESS_ART)
    if (artToken === null) {
      artToken = new Token(ADDRESS_ART)

      let addressART =  Address.fromString(ADDRESS_ART)
      artToken.symbol = fetchTokenSymbol(addressART)
      artToken.name = fetchTokenName(addressART)
      artToken.decimals = fetchTokenDecimals(addressART)
      artToken.totalSupply = fetchTokenTotalSupply(addressART)
      artToken.save()
    }

    // create payment token is necessary
    let paymentToken = Token.load(ADDRESS_AKRE)
    if (paymentToken === null) {
      paymentToken = new Token(ADDRESS_AKRE)

      let addressPayment =  Address.fromString(ADDRESS_AKRE)
      paymentToken.symbol = fetchTokenSymbol(addressPayment)
      paymentToken.name = fetchTokenName(addressPayment)
      paymentToken.decimals = fetchTokenDecimals(addressPayment)
      paymentToken.totalSupply = fetchTokenTotalSupply(addressPayment)
      paymentToken.save()
    }
  }

  updateARECSnapshort(event.block.timestamp)
  
  let arecOverview = ARECOverview.load("AREC_VIEW")
  if (arecOverview === null) {
    arecOverview = new ARECOverview("AREC_VIEW")
    arecOverview.lastBlockHeight = event.block.number
    arecOverview.dayStartTimestamp = 0
    arecOverview.numARECNFTMinted = 0
    arecOverview.numARECNFTCertified = 0
    arecOverview.numARECNFTRedeemed = 0
    arecOverview.numARECNFTLiquidized = 0
    arecOverview.numARECNFTRejected = 0
    arecOverview.numARECNFTCancelled = 0
    arecOverview.numARECNFTSolidified = 0
    arecOverview.numClimateAction = 0
    arecOverview.numClimateActionClaimed = 0
    arecOverview.numClimateBadge = 0
    arecOverview.amountARECNFTMinted = ZERO_BI
    arecOverview.amountARECNFTCertified = ZERO_BI
    arecOverview.amountARECNFTRedeemed = ZERO_BI
    arecOverview.amountARECNFTLiquidized = ZERO_BI
    arecOverview.amountARECNFTRejected = ZERO_BI
    arecOverview.amountARECNFTCancelled = ZERO_BI
    arecOverview.amountARECOffset = ZERO_BI
    arecOverview.amountARECOffsetClaimed = ZERO_BI
    arecOverview.amountARECSolidied = ZERO_BI
    arecOverview.ARTList = []
    arecOverview.save()
  }

  let artOverview = ARTOverview.load(ADDRESS_ART)
  if (artOverview === null) {
    artOverview = new ARTOverview(ADDRESS_ART)
    artOverview.assetType = arecAssetType.id
    artOverview.numNFTMinted = 0
    artOverview.numNFTCertified = 0
    artOverview.numNFTRedeemed = 0
    artOverview.numNFTLiquidized = 0
    artOverview.numNFTRejected = 0
    artOverview.numNFTCancelled = 0    
    artOverview.numSolidified = 0    
    artOverview.numOffsetAction = 0
    artOverview.numOffsetClaimed = 0
    artOverview.amountNFTMinted = ZERO_BI
    artOverview.amountNFTCertified = ZERO_BI
    artOverview.amountNFTRedeemed = ZERO_BI
    artOverview.amountNFTLiquidized = ZERO_BI
    artOverview.amountNFTRejected = ZERO_BI
    artOverview.amountNFTCancelled = ZERO_BI
    artOverview.amountARTOffset = ZERO_BI
    artOverview.amountARTOffsetClaimed = ZERO_BI
    artOverview.amountARTSolidied = ZERO_BI
    artOverview.save()

    let ARTList = arecOverview.ARTList
    ARTList.push(artOverview.id)
    arecOverview.ARTList = ARTList
    arecOverview.save()

    ArkreenRECTokenTemplate.create(Address.fromString(ADDRESS_ART))
  }

  let arkreenRECIssuance = ArkreenRECIssuance.bind(Address.fromString(ADDRESS_ISSUANCE))
  let recData = arkreenRECIssuance.getRECData(event.params.tokenId)
  //let owner = arkreenRECIssuance.ownerOf(event.params.tokenId)

  let NFTID = event.params.tokenId.toString()
  let arecNFT = new ARECNFT("AREC_NFT_" + NFTID.padStart(6,'0'))
  arecNFT.lastBlockHeight = event.block.number
  arecNFT.hashTx = event.transaction.hash
  arecNFT.artInfo = artOverview.id
  arecNFT.timeMinted = event.block.timestamp.toI32()
  arecNFT.timeCertified = 0
  arecNFT.timeRedeemed = 0
  arecNFT.timeLiquidized = 0
  arecNFT.timeRejected = 0
  arecNFT.timeCancelled = 0
  arecNFT.amountREC = recData.amountREC
  arecNFT.amountRECRetired = ZERO_BI
  arecNFT.minter = recData.minter
  arecNFT.owner = recData.minter
  arecNFT.serialNumber = ''
  arecNFT.startTime = recData.startTime.toI32()
  arecNFT.endTime = recData.endTime.toI32()
  arecNFT.region = recData.region
  arecNFT.cID = recData.cID
  arecNFT.url = recData.url
  arecNFT.status = recData.status
  arecNFT.save()

  let userARECOverview = checkUserARECOverview("USER_AREC_" + recData.minter.toHexString())
  userARECOverview.numARECNFTMinted = userARECOverview.numARECNFTMinted +1

  let amountAKREToPay = recData.amountREC.times(BigInt.fromString("100000000000"))

  if(event.block.number < blockMainLaunch) {
    amountAKREToPay = amountAKREToPay.div(BigInt.fromString("10"))
  }  else if(event.block.number >= blockRateChange) {
    amountAKREToPay = amountAKREToPay.times(BigInt.fromString("10"))
  }

  userARECOverview.amountARECNFTMinted = userARECOverview.amountARECNFTMinted.plus(recData.amountREC)
  userARECOverview.amountAKRE = userARECOverview.amountAKRE.plus(amountAKREToPay)
  userARECOverview.save()

  artOverview.numNFTMinted = artOverview.numNFTMinted + 1
  artOverview.amountNFTMinted = artOverview.amountNFTMinted.plus(recData.amountREC)
  artOverview.save()

  arecOverview.numARECNFTMinted = arecOverview.numARECNFTMinted + 1 
  arecOverview.amountARECNFTMinted = arecOverview.amountARECNFTMinted.plus(recData.amountREC)
  arecOverview.amountAKRE = arecOverview.amountAKRE.plus(amountAKREToPay)
  arecOverview.save()
/*
  let addressAKRE =  Address.fromString(ADDRESS_AKRE)
  let addressAREC =  Address.fromString(ADDRESS_ISSUANCE)
  let balanceAREC = fetchTokenBalance(addressAKRE, addressAREC)
  if (arecOverview.amountAKRE != balanceAREC) {
    log.warning('AKRE Balance not identical: {} {} {}', [event.transaction.hash.toHexString(),
      arecOverview.amountAKRE.toHexString(), balanceAREC.toHexString()])
  }
*/
}

// event ESGBatchMinted(address owner, uint256 tokenId)
export function handleESGBatchMinted(event: ESGBatchMinted): void {
  
  let arkreenRECIssuance = ArkreenRECIssuance.bind(Address.fromString(ADDRESS_ISSUANCE))
  let recData = arkreenRECIssuance.getRECData(event.params.tokenId)
  //let owner = arkreenRECIssuance.ownerOf(event.params.tokenId)

/*  
  log.debug("AAAAAA event.transaction.input: {}, {}", [event.transaction.input.toHexString(), event.transaction.input.toHexString().slice(10)] )

  let callData = ethereum.decode('(uint256,uint256,(address,uint256,uint256,uint8,bytes32,bytes32)))', 
                                  Bytes.fromHexString('0x0000000000000000000000000000000000000000000000000000000000000020'.concat( 
                                                      event.transaction.input.toHexString().slice(10))))

  log.debug("BBBBBBBBBBB callData:", [callData!.toTuple()[0].toString(), callData!.toTuple()[1].toString()])  
  
  let arecType = callData!.toTuple()[0].toString()  
  */                              

  let arecType = recData.idAsset.toString()
  
  let arecAssetType = AREC_ASSET.load("AREC_ASSET_" + arecType.padStart(3,'0'))

  if (arecAssetType === null) {
    arecAssetType = new AREC_ASSET("AREC_ASSET_" + arecType.padStart(3,'0'))

    let arkreenRegistry = ArkreenRegistry.bind(Address.fromString(ADDRESS_REGISTRY))
    let assetInfo = arkreenRegistry.getAssetInfo(BigInt.fromI32(recData.idAsset))
    arecAssetType.issuer = assetInfo.value0
    arecAssetType.tokenREC = assetInfo.value1.toHexString()
    arecAssetType.tokenPay = assetInfo.value2
    arecAssetType.rateToIssue = assetInfo.value3
    arecAssetType.rateToLiquidize = BigInt.fromI32(assetInfo.value4)
    arecAssetType.save()

    // create ART token is necessary
    let artAddrString =  arecAssetType.tokenREC
    let artToken = Token.load(artAddrString)
    if (artToken === null) {
      artToken = new Token(artAddrString)

      let addressART =  Address.fromString(artAddrString)
      artToken.symbol = fetchTokenSymbol(addressART)
      artToken.name = fetchTokenName(addressART)
      artToken.decimals = fetchTokenDecimals(addressART)
      artToken.totalSupply = fetchTokenTotalSupply(addressART)
      artToken.save()
    }

    // create payment token is necessary
    let paymentAddrString =  arecAssetType.tokenPay.toHexString()
    let paymentToken = Token.load(paymentAddrString)
    if (paymentToken === null) {
      paymentToken = new Token(paymentAddrString)

      let addressPayment =  Address.fromString(paymentAddrString)
      paymentToken.symbol = fetchTokenSymbol(addressPayment)
      paymentToken.name = fetchTokenName(addressPayment)
      paymentToken.decimals = fetchTokenDecimals(addressPayment)
      paymentToken.totalSupply = fetchTokenTotalSupply(addressPayment)
      paymentToken.save()
    }
  }

  updateARECSnapshort(event.block.timestamp)

  let arecOverview = ARECOverview.load("AREC_VIEW")
  if (arecOverview === null) {
    arecOverview = new ARECOverview("AREC_VIEW")
    arecOverview.lastBlockHeight = event.block.number
    arecOverview.dayStartTimestamp = 0
    arecOverview.numARECNFTMinted = 0
    arecOverview.numARECNFTCertified = 0
    arecOverview.numARECNFTRedeemed = 0
    arecOverview.numARECNFTLiquidized = 0
    arecOverview.numARECNFTRejected = 0
    arecOverview.numARECNFTCancelled = 0
    arecOverview.numARECNFTSolidified = 0
    arecOverview.numClimateAction = 0
    arecOverview.numClimateActionClaimed = 0
    arecOverview.numClimateBadge = 0
    arecOverview.amountARECNFTMinted = ZERO_BI
    arecOverview.amountARECNFTCertified = ZERO_BI
    arecOverview.amountARECNFTRedeemed = ZERO_BI
    arecOverview.amountARECNFTLiquidized = ZERO_BI
    arecOverview.amountARECNFTRejected = ZERO_BI
    arecOverview.amountARECNFTCancelled = ZERO_BI
    arecOverview.amountARECOffset = ZERO_BI
    arecOverview.amountARECOffsetClaimed = ZERO_BI
    arecOverview.amountARECSolidied = ZERO_BI
    arecOverview.amountAKRE = ZERO_BI
    arecOverview.ARTList = []
    arecOverview.save()
  }

  let artOverview = ARTOverview.load(arecAssetType.tokenREC)
  if (artOverview === null) {
    artOverview = new ARTOverview(arecAssetType.tokenREC)
    artOverview.assetType = arecAssetType.id
    artOverview.numNFTMinted = 0
    artOverview.numNFTCertified = 0
    artOverview.numNFTRedeemed = 0
    artOverview.numNFTLiquidized = 0
    artOverview.numNFTRejected = 0
    artOverview.numNFTCancelled = 0
    artOverview.numSolidified = 0
    artOverview.numOffsetAction = 0
    artOverview.numOffsetClaimed = 0
    artOverview.amountNFTMinted = ZERO_BI
    artOverview.amountNFTCertified = ZERO_BI
    artOverview.amountNFTRedeemed = ZERO_BI
    artOverview.amountNFTLiquidized = ZERO_BI
    artOverview.amountNFTRejected = ZERO_BI
    artOverview.amountNFTCancelled = ZERO_BI
    artOverview.amountARTOffset = ZERO_BI
    artOverview.amountARTOffsetClaimed = ZERO_BI
    artOverview.amountARTSolidied = ZERO_BI
    artOverview.save()

    let ARTList = arecOverview.ARTList
    ARTList.push(artOverview.id)
    arecOverview.ARTList = ARTList
    arecOverview.save()

    ArkreenRECTokenTemplate.create(Address.fromString(arecAssetType.tokenREC))
  }

  let NFTID = event.params.tokenId.toString()
  let arecNFT = new ARECNFT("AREC_NFT_" + NFTID.padStart(6,'0'))
  arecNFT.lastBlockHeight = event.block.number
  arecNFT.hashTx = event.transaction.hash
  arecNFT.artInfo = artOverview.id
  arecNFT.timeMinted = event.block.timestamp.toI32()
  arecNFT.timeCertified = 0
  arecNFT.timeRedeemed = 0
  arecNFT.timeLiquidized = 0
  arecNFT.timeRejected = 0
  arecNFT.timeCancelled = 0
  arecNFT.amountREC = recData.amountREC
  arecNFT.amountRECRetired = ZERO_BI
  arecNFT.minter = recData.minter
  arecNFT.owner = recData.minter
  arecNFT.serialNumber = ''
  arecNFT.startTime = 0
  arecNFT.endTime = 0
  arecNFT.region = ''
  arecNFT.cID = ''
  arecNFT.url = ''
  arecNFT.status = recData.status
  arecNFT.save()

  let userARECOverview = checkUserARECOverview("USER_AREC_" + recData.minter.toHexString())
  userARECOverview.numARECNFTMinted = userARECOverview.numARECNFTMinted +1

  let amountAKREToPay = recData.amountREC.times(BigInt.fromString("100000000000"))

  if(event.block.number < blockMainLaunch) {
    amountAKREToPay = amountAKREToPay.div(BigInt.fromString("10"))
  }  else if(event.block.number >= blockRateChange) {
    amountAKREToPay = amountAKREToPay.times(BigInt.fromString("10"))
  }

  userARECOverview.amountARECNFTMinted = userARECOverview.amountARECNFTMinted.plus(recData.amountREC)
  userARECOverview.amountAKRE = userARECOverview.amountAKRE.plus(amountAKREToPay)

  userARECOverview.save()

  artOverview.numNFTMinted = artOverview.numNFTMinted + 1
  artOverview.amountNFTMinted = artOverview.amountNFTMinted.plus(recData.amountREC)
  artOverview.save()

  arecOverview.numARECNFTMinted = arecOverview.numARECNFTMinted +1 
  arecOverview.amountARECNFTMinted = arecOverview.amountARECNFTMinted.plus(recData.amountREC)
  arecOverview.amountAKRE = arecOverview.amountAKRE.plus(amountAKREToPay)
  arecOverview.save()
/*
  let addressAKRE =  Address.fromString(ADDRESS_AKRE)
  let addressAREC =  Address.fromString(ADDRESS_ISSUANCE)
  let balanceAREC = fetchTokenBalance(addressAKRE, addressAREC)
  if (arecOverview.amountAKRE != balanceAREC) {
    log.warning('AKRE Balance not identical: {} {} {}', [event.transaction.hash.toHexString(),
      arecOverview.amountAKRE.toHexString(), balanceAREC.toHexString()])
  }
*/    
}

// event RECCertified(address,uint256)
export function handleRECCertified(event: RECCertified): void {

  let arkreenRECIssuance = ArkreenRECIssuance.bind(Address.fromString(ADDRESS_ISSUANCE))
  let recData = arkreenRECIssuance.getRECData(event.params.tokenId)

  let NFTID = event.params.tokenId.toString()
  let arecNFT = ARECNFT.load("AREC_NFT_" + NFTID.padStart(6,'0'))!
  
  arecNFT.lastBlockHeight = event.block.number
  arecNFT.timeCertified = event.block.timestamp.toI32()
  arecNFT.serialNumber = recData.serialNumber
  arecNFT.startTime = recData.startTime.toI32()
  arecNFT.endTime = recData.endTime.toI32()
  arecNFT.region = recData.region
  arecNFT.cID = recData.cID
  arecNFT.url = recData.url
  arecNFT.status = recData.status
  arecNFT.save()

  let artOverview = ARTOverview.load(arecNFT.artInfo)!
  artOverview.numNFTCertified = artOverview.numNFTCertified + 1
  artOverview.amountNFTCertified = artOverview.amountNFTCertified.plus(recData.amountREC)
  artOverview.save()

  let userARECOverview = UserARECOverview.load("USER_AREC_" + recData.minter.toHexString())!
  userARECOverview.numARECNFTCertified = userARECOverview.numARECNFTCertified + 1
  userARECOverview.amountARECNFTCertified = userARECOverview.amountARECNFTCertified.plus(recData.amountREC)

  // let arecNFTListCertified = userARECOverview.arecNFTListCertified
  // arecNFTListCertified.push(arecNFT.id)
  // userARECOverview.arecNFTListCertified = arecNFTListCertified

  userARECOverview.save()

  updateARECSnapshort(event.block.timestamp)

  let arecOverview = ARECOverview.load("AREC_VIEW")!
  arecOverview.numARECNFTCertified = arecOverview.numARECNFTCertified +1 
  arecOverview.amountARECNFTCertified = arecOverview.amountARECNFTCertified.plus(recData.amountREC)
  arecOverview.lastBlockHeight = event.block.number
  arecOverview.save()
}

// event RedeemFinished(address redeemEntity, uint256 tokenId, uint256 offsetActionId)
export function handleRedeemFinished(event: RedeemFinished): void {
  let arkreenRECIssuance = ArkreenRECIssuance.bind(Address.fromString(ADDRESS_ISSUANCE))
  let recData = arkreenRECIssuance.getRECData(event.params.tokenId)

  let NFTID = event.params.tokenId.toString()
  let arecNFT = ARECNFT.load("AREC_NFT_" + NFTID.padStart(6,'0'))!

  arecNFT.lastBlockHeight = event.block.number
  arecNFT.timeRedeemed = event.block.timestamp.toI32()
  arecNFT.amountRECRetired = arecNFT.amountREC
  arecNFT.status = recData.status
  arecNFT.save()
  
  let artOverview = ARTOverview.load(arecNFT.artInfo)!
  let climateAction  = new ClimateAction("Action_" + event.params.offsetActionId.toString().padStart(6,'0'))

  let arkreenBadge = ArkreenBadge.bind(Address.fromString(ADDRESS_AREC_BADGE))
  let actionInfoResult = arkreenBadge.try_getOffsetActions(event.params.offsetActionId)
  
  if (!actionInfoResult.reverted) {
    let actionInfo = actionInfoResult.value

    climateAction.ARTAsset = artOverview.id
    climateAction.offsetEntity = actionInfo.offsetEntity
    climateAction.issuerREC = actionInfo.issuerREC
    climateAction.amount = actionInfo.amount
    climateAction.actionType = 'Redeem'

    let areNFT = ARECNFT.load("AREC_NFT_" + actionInfo.tokenId.toString().padStart(6,'0'))!
    climateAction.arecNFTRetired = areNFT.id

    climateAction.createdAt = actionInfo.createdAt.toI32()
    climateAction.bClaimed = actionInfo.bClaimed
    climateAction.save()
  } else {
    let offsetActionsResult  = arkreenBadge.offsetActions(event.params.offsetActionId)

    climateAction.ARTAsset = artOverview.id
    climateAction.offsetEntity = offsetActionsResult.value0
    climateAction.issuerREC = offsetActionsResult.value1
    climateAction.amount = offsetActionsResult.value2
    climateAction.actionType = 'Redeem'
  
    let areNFT = ARECNFT.load("AREC_NFT_" + offsetActionsResult.value3.toString().padStart(6,'0'))!
    climateAction.arecNFTRetired = areNFT.id
  
    climateAction.createdAt = offsetActionsResult.value4.toI32()
    climateAction.bClaimed = offsetActionsResult.value5
    climateAction.save()
  }

  artOverview.numNFTRedeemed = artOverview.numNFTRedeemed + 1
  artOverview.numOffsetAction = artOverview.numOffsetAction + 1
  artOverview.amountNFTRedeemed = artOverview.amountNFTRedeemed.plus(recData.amountREC)
  artOverview.save()

  updateARECSnapshort(event.block.timestamp)

  let arecOverview = ARECOverview.load("AREC_VIEW")!
  arecOverview.numARECNFTRedeemed = arecOverview.numARECNFTRedeemed + 1 
  arecOverview.numClimateAction = arecOverview.numClimateAction + 1 
  arecOverview.amountARECNFTRedeemed = arecOverview.amountARECNFTRedeemed.plus(recData.amountREC)
  arecOverview.lastBlockHeight = event.block.number
  arecOverview.save()

  let userARECOverview = UserARECOverview.load("USER_AREC_" + event.params.redeemEntity.toHexString())!

  userARECOverview.numARECNFTRedeemed = arecOverview.numARECNFTRedeemed + 1 
  userARECOverview.numClimateAction = arecOverview.numClimateAction + 1 
  userARECOverview.amountARECNFTRedeemed = arecOverview.amountARECNFTRedeemed.plus(recData.amountREC)
  userARECOverview.save()
}

// event RECLiquidized(address owner, uint256 tokenId, uint256 amountREC)
export function handleRECLiquidized(event: RECLiquidized): void {
  let arkreenRECIssuance = ArkreenRECIssuance.bind(Address.fromString(ADDRESS_ISSUANCE))
  let recData = arkreenRECIssuance.getRECData(event.params.tokenId)

  let NFTID = event.params.tokenId.toString()
  let arecNFT = ARECNFT.load("AREC_NFT_" + NFTID.padStart(6,'0'))!

  arecNFT.lastBlockHeight = event.block.number
  arecNFT.timeLiquidized = event.block.timestamp.toI32()
  arecNFT.status = recData.status
  arecNFT.save()

  let artOverview = ARTOverview.load(arecNFT.artInfo)!
  artOverview.numNFTLiquidized = artOverview.numNFTLiquidized + 1
  artOverview.amountNFTLiquidized = artOverview.amountNFTLiquidized.plus(recData.amountREC)
  artOverview.save()

  updateARECSnapshort(event.block.timestamp)

  let arecOverview = ARECOverview.load("AREC_VIEW")!
  arecOverview.numARECNFTLiquidized = arecOverview.numARECNFTLiquidized +1 
  arecOverview.amountARECNFTLiquidized = arecOverview.amountARECNFTLiquidized.plus(recData.amountREC)
  arecOverview.lastBlockHeight = event.block.number
  arecOverview.save()

   // May get the AREC NFT by transfer
  let userARECOverview = checkUserARECOverview("USER_AREC_" + recData.minter.toHexString())
  userARECOverview.numARECNFTLiquidized = userARECOverview.numARECNFTLiquidized + 1
  userARECOverview.amountARECNFTLiquidized = userARECOverview.amountARECNFTLiquidized.minus(recData.amountREC)
  userARECOverview.save()
}

// event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
export function handleTransfer(event: Transfer): void {
  if (event.params.from.toHexString() != ADDRESS_ZERO) {
    let NFTID = event.params.tokenId.toString()
    let arecNFT = ARECNFT.load("AREC_NFT_" + NFTID.padStart(6,'0'))!
    arecNFT.lastBlockHeight = event.block.number
    arecNFT.owner = event.params.to
    arecNFT.save()
  }

  let artOverview = ARTOverview.load(event.params.from.toHexString())
  if((artOverview !== null) && (event.params.to.toHexString() != ADDRESS_AREC_BADGE)) {         // Solidify
    let arkreenRECIssuance = ArkreenRECIssuance.bind(Address.fromString(ADDRESS_ISSUANCE))
    let recData = arkreenRECIssuance.getRECData(event.params.tokenId)

    let NFTID = event.params.tokenId.toString()
    let arecNFT = ARECNFT.load("AREC_NFT_" + NFTID.padStart(6,'0'))!
    arecNFT.lastBlockHeight = event.block.number
    arecNFT.status = recData.status
    arecNFT.owner = event.params.to
    arecNFT.save()
  }
}

// event RECRejected(uint256 tokenId)
export function handleRECRejected(event: RECRejected): void {
  let arkreenRECIssuance = ArkreenRECIssuance.bind(Address.fromString(ADDRESS_ISSUANCE))
  let recData = arkreenRECIssuance.getRECData(event.params.tokenId)

  updateARECSnapshort(event.block.timestamp)

  let arecOverview = ARECOverview.load("AREC_VIEW")!

  arecOverview.numARECNFTRejected = arecOverview.numARECNFTRejected + 1 
  arecOverview.amountARECNFTRejected = arecOverview.amountARECNFTRejected.plus(recData.amountREC)
  arecOverview.lastBlockHeight = event.block.number
  arecOverview.save()

  let NFTID = event.params.tokenId.toString()
  let arecNFT = ARECNFT.load("AREC_NFT_" + NFTID.padStart(6,'0'))!

  arecNFT.lastBlockHeight = event.block.number
  arecNFT.timeRejected = event.block.timestamp.toI32()
  arecNFT.status = recData.status
  arecNFT.save()

  let artOverview = ARTOverview.load(arecNFT.artInfo)!
  artOverview.numNFTRejected = artOverview.numNFTRejected + 1
  artOverview.amountNFTRejected = artOverview.amountNFTRejected.plus(recData.amountREC)
  artOverview.save()
  
  let userARECOverview = UserARECOverview.load("USER_AREC_" + recData.minter.toHexString())!
  userARECOverview.numARECNFTRejected = userARECOverview.numARECNFTRejected + 1
  userARECOverview.amountARECNFTRejected = userARECOverview.amountARECNFTRejected.plus(recData.amountREC)
  userARECOverview.save()
}

// event RECCanceled(address owner, uint256 tokenId)
export function handleRECCanceled(event: RECCanceled): void {
  let arkreenRECIssuance = ArkreenRECIssuance.bind(Address.fromString(ADDRESS_ISSUANCE))
  let recData = arkreenRECIssuance.getRECData(event.params.tokenId)

  updateARECSnapshort(event.block.timestamp)

  let arecOverview = ARECOverview.load("AREC_VIEW")!

  arecOverview.numARECNFTCancelled = arecOverview.numARECNFTCancelled + 1 
  arecOverview.amountARECNFTCancelled = arecOverview.amountARECNFTCancelled.plus(recData.amountREC)

  arecOverview.numARECNFTRejected = arecOverview.numARECNFTRejected - 1
  arecOverview.amountARECNFTRejected = arecOverview.amountARECNFTRejected.minus(recData.amountREC)
  arecOverview.lastBlockHeight = event.block.number
  arecOverview.save()

  let NFTID = event.params.tokenId.toString()
  let arecNFT = ARECNFT.load("AREC_NFT_" + NFTID.padStart(6,'0'))!

  arecNFT.lastBlockHeight = event.block.number
  arecNFT.timeCancelled = event.block.timestamp.toI32()
  arecNFT.status = recData.status
  arecNFT.save()

  let artOverview = ARTOverview.load(arecNFT.artInfo)!
  artOverview.numNFTCancelled = artOverview.numNFTCancelled + 1
  artOverview.numNFTRejected = artOverview.numNFTRejected - 1
  
  artOverview.amountNFTCancelled = artOverview.amountNFTCancelled.plus(recData.amountREC)
  artOverview.amountNFTRejected = artOverview.amountNFTRejected.minus(recData.amountREC)
  
  artOverview.save()

  let userARECOverview = UserARECOverview.load("USER_AREC_" + recData.minter.toHexString())!
  userARECOverview.numARECNFTCancelled = userARECOverview.numARECNFTCancelled + 1
  userARECOverview.numARECNFTRejected = userARECOverview.numARECNFTRejected - 1
  userARECOverview.amountARECNFTCancelled = userARECOverview.amountARECNFTCancelled.plus(recData.amountREC)
  userARECOverview.amountARECNFTRejected = userARECOverview.amountARECNFTRejected.minus(recData.amountREC)
  userARECOverview.save()
}

// event RECDataUpdated(address owner, uint256 tokenId)
export function handleRECDataUpdated(event: RECDataUpdated): void {
  let arkreenRECIssuance = ArkreenRECIssuance.bind(Address.fromString(ADDRESS_ISSUANCE))
  let recData = arkreenRECIssuance.getRECData(event.params.tokenId)

  updateARECSnapshort(event.block.timestamp)

  let arecOverview = ARECOverview.load("AREC_VIEW")!

  arecOverview.numARECNFTRejected = arecOverview.numARECNFTRejected - 1
  arecOverview.amountARECNFTRejected = arecOverview.amountARECNFTRejected.minus(recData.amountREC)
  arecOverview.lastBlockHeight = event.block.number
  arecOverview.save()

  let NFTID = event.params.tokenId.toString()
  let arecNFT = ARECNFT.load("AREC_NFT_" + NFTID.padStart(6,'0'))!
  
  arecNFT.lastBlockHeight = event.block.number
  arecNFT.region = recData.region;                            // Null string is not checked, as it could be set to null
  arecNFT.url = recData.url;
  arecNFT.status = recData.status
  arecNFT.save()

  let artOverview = ARTOverview.load(arecNFT.artInfo)!
  artOverview.numNFTRejected = artOverview.numNFTRejected - 1
  artOverview.amountNFTRejected = artOverview.amountNFTRejected.minus(recData.amountREC)
  artOverview.save()

  let userARECOverview = UserARECOverview.load("USER_AREC_" + recData.minter.toHexString())!
  userARECOverview.numARECNFTRejected = userARECOverview.numARECNFTRejected - 1
  userARECOverview.amountARECNFTRejected = userARECOverview.amountARECNFTRejected.minus(recData.amountREC)
  userARECOverview.save()
}
