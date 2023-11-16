/* eslint-disable prefer-const */
import { BigInt, BigDecimal, log, Address, ethereum, Bytes } from '@graphprotocol/graph-ts'
import { ARECOverview,  ARTOverview, ARECNFT } from '../types/schema'
import { AREC_ASSET, Token } from '../types/schema'


import { RECRequested, ESGBatchMinted, RECCertified, ArkreenRECIssuance } from '../types/ArkreenRECIssuance/ArkreenRECIssuance'
import { RedeemFinished, RECLiquidized, Transfer } from '../types/ArkreenRECIssuance/ArkreenRECIssuance'
import { ArkreenRegistry } from '../types/ArkreenRECIssuance/ArkreenRegistry'

import { fetchTokenSymbol, fetchTokenName, fetchTokenDecimals, fetchTokenTotalSupply } from './helpers'

export let ZERO_BI = BigInt.fromI32(0)
export let ONE_BI = BigInt.fromI32(1)
export let ZERO_BD = BigDecimal.fromString('0')
export let ONE_BD = BigDecimal.fromString('1')
export let BI_18 = BigInt.fromI32(18)

const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000'
const ADDRESS_NATIVE = '0x9c3c9283d3e44854697cd22d3faa240cfb032889'
const ADDRESS_BANK = '0x7ee6d2a14d6db71339a010d44793b27895b36d50'     
const ADDRESS_ART   = '0x58e4d14ccddd1e993e6368a8c5eaa290c95cafdf' 
const ADDRESS_hART  = '0x93b3bb6c51a247a27253c33f0d0c2ff1d4343214' 
const ADDRESS_cART  = '0x0d7899f2d36344ed21829d4ebc49cc0d335b4a06'
const ADDRESS_REGISTRY  = '0xb17facaca106fb3d216923db6cabfc7c0517029d'
const ADDRESS_ISSUANCE  = '0x954585adf9425f66a0a2fd8e10682eb7c4f1f1fd'   
const ADDRESS_AKRE      = '0x21b101f5d61a66037634f7e1beb5a733d9987d57'    // tAKRE

// event RECRequested(address owner, uint256 tokenId)
export function handleRECRequested(event: RECRequested): void {

  let arecAssetType = AREC_ASSET.load("AREC_ASSET_000")
  if (arecAssetType === null) {
    arecAssetType = new AREC_ASSET("AREC_ASSET_000")

    let arkreenRECIssuance = ArkreenRECIssuance.bind(Address.fromString(ADDRESS_ISSUANCE))
    let paymentTokenPrice = arkreenRECIssuance.paymentTokenPrice(Address.fromString(ADDRESS_AKRE))

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
  
  let arecOverview = ARECOverview.load("AREC_VIEW")
  if (arecOverview === null) {
    arecOverview = new ARECOverview("AREC_VIEW")
    arecOverview.save()
  }

  let artOverview = ARTOverview.load(ADDRESS_ART)
  if (artOverview === null) {
    artOverview = new ARTOverview(ADDRESS_ART)
    artOverview.assetType = arecAssetType.id
    artOverview.save()

    let ARTList = arecOverview.ARTList
    ARTList.push(artOverview.id)
    arecOverview.ARTList = ARTList
    arecOverview.save()
  }

  let arkreenRECIssuance = ArkreenRECIssuance.bind(Address.fromString(ADDRESS_ISSUANCE))
  let recData = arkreenRECIssuance.getRECData(event.params.tokenId)
  let owner = arkreenRECIssuance.ownerOf(event.params.tokenId)

  let NFTID = event.params.tokenId.toString()
  let arecNFT = new ARECNFT("AREC_NFT_" + NFTID.padStart(6,'0'))
  arecNFT.hashTx = event.transaction.hash
  arecNFT.artInfo = artOverview.id
  arecNFT.timeMinted = event.block.timestamp.toI32()
  arecNFT.amountREC = recData.amountREC
  arecNFT.startTime = recData.startTime.toI32()
  arecNFT.endTime = recData.endTime.toI32()
  arecNFT.region = recData.region
  arecNFT.cID = recData.cID
  arecNFT.url = recData.url
  arecNFT.status = recData.status
  arecNFT.owner = owner
  arecNFT.save()

  artOverview.numNFTMinted = artOverview.numNFTMinted + 1
  artOverview.amountNFTMinted = artOverview.amountNFTMinted.plus(recData.amountREC)
  artOverview.save()

  arecOverview.numARECNFTMinted = arecOverview.numARECNFTMinted + 1 
  arecOverview.amountARECNFTMinted = arecOverview.amountARECNFTMinted.plus(recData.amountREC)
  arecOverview.save()
}

// event ESGBatchMinted(address owner, uint256 tokenId)
export function handleESGBatchMinted(event: ESGBatchMinted): void {
  
  let arkreenRECIssuance = ArkreenRECIssuance.bind(Address.fromString(ADDRESS_ISSUANCE))
  let recData = arkreenRECIssuance.getRECData(event.params.tokenId)
  let owner = arkreenRECIssuance.ownerOf(event.params.tokenId)

  let callData = ethereum.decode('(uint256,uint256,(address,uint256,uint256,uint8,bytes32,bytes32)))', 
                                  Bytes.fromHexString(event.transaction.input.toHexString().slice(10)))

  let arecType = callData!.toTuple()[0].toString()
  
  let arecAssetType = AREC_ASSET.load("AREC_ASSET_" + arecType.padStart(3,'0'))

  if (arecAssetType === null) {
    arecAssetType = new AREC_ASSET("AREC_ASSET_" + arecType.padStart(3,'0'))

    let arkreenRegistry = ArkreenRegistry.bind(Address.fromString(ADDRESS_REGISTRY))
    let assetInfo = arkreenRegistry.getAssetInfo(event.params.tokenId)
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

  let arecOverview = ARECOverview.load("AREC_VIEW")
  if (arecOverview === null) {
    arecOverview = new ARECOverview("AREC_VIEW")
    arecOverview.save()
  }

  let artOverview = ARTOverview.load(arecAssetType.tokenREC)
  if (artOverview === null) {
    artOverview = new ARTOverview(arecAssetType.tokenREC)
    artOverview.assetType = arecAssetType.id
    artOverview.save()

    let ARTList = arecOverview.ARTList
    ARTList.push(artOverview.id)
    arecOverview.ARTList = ARTList
    arecOverview.save()
  }

  let NFTID = event.params.tokenId.toString()
  let arecNFT = new ARECNFT("AREC_NFT_" + NFTID.padStart(6,'0'))
  arecNFT.hashTx = event.transaction.hash
  arecNFT.artInfo = artOverview.id
  arecNFT.timeMinted = event.block.timestamp.toI32()

  arecNFT.amountREC = recData.amountREC
  arecNFT.status = recData.status
  arecNFT.owner = owner
  arecNFT.save()

  artOverview.numNFTMinted = artOverview.numNFTMinted + 1
  artOverview.amountNFTMinted = artOverview.amountNFTMinted.plus(recData.amountREC)
  artOverview.save()

  arecOverview.numARECNFTMinted = arecOverview.numARECNFTMinted +1 
  arecOverview.amountARECNFTMinted = arecOverview.amountARECNFTMinted.plus(recData.amountREC)
  arecOverview.save()
}

// event RECCertified(address,uint256)
export function handleRECCertified(event: RECCertified): void {

  let arkreenRECIssuance = ArkreenRECIssuance.bind(Address.fromString(ADDRESS_ISSUANCE))
  let recData = arkreenRECIssuance.getRECData(event.params.tokenId)

  let NFTID = event.params.tokenId.toString()
  let arecNFT = ARECNFT.load("AREC_NFT_" + NFTID.padStart(6,'0'))!

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

  let arecOverview = ARECOverview.load("AREC_VIEW")!
  arecOverview.numARECNFTCertified = arecOverview.numARECNFTCertified +1 
  arecOverview.amountARECNFTCertified = arecOverview.amountARECNFTCertified.plus(recData.amountREC)
  arecOverview.save()
}

// event RedeemFinished(address redeemEntity, uint256 tokenId, uint256 offsetActionId)
export function handleRedeemFinished(event: RedeemFinished): void {
  let arkreenRECIssuance = ArkreenRECIssuance.bind(Address.fromString(ADDRESS_ISSUANCE))
  let recData = arkreenRECIssuance.getRECData(event.params.tokenId)

  let NFTID = event.params.tokenId.toString()
  let arecNFT = ARECNFT.load("AREC_NFT_" + NFTID.padStart(6,'0'))!

  arecNFT.timeRedeemed = event.block.timestamp.toI32()
  arecNFT.amountRECRetired = arecNFT.amountREC
  arecNFT.status = recData.status
  arecNFT.save()

  let artOverview = ARTOverview.load(arecNFT.artInfo)!
  artOverview.numNFTRedeemed = artOverview.numNFTRedeemed + 1
  artOverview.amountNFTRedeemed = artOverview.amountNFTRedeemed.plus(recData.amountREC)
  artOverview.save()

  let arecOverview = ARECOverview.load("AREC_VIEW")!
  arecOverview.numARECNFTRedeemed = arecOverview.numARECNFTRedeemed +1 
  arecOverview.amountARECNFTRedeemed = arecOverview.amountARECNFTRedeemed.plus(recData.amountREC)
  arecOverview.save()
}

// event RECLiquidized(address owner, uint256 tokenId, uint256 amountREC)
export function handleRECLiquidized(event: RECLiquidized): void {
  let arkreenRECIssuance = ArkreenRECIssuance.bind(Address.fromString(ADDRESS_ISSUANCE))
  let recData = arkreenRECIssuance.getRECData(event.params.tokenId)

  let NFTID = event.params.tokenId.toString()
  let arecNFT = ARECNFT.load("AREC_NFT_" + NFTID.padStart(6,'0'))!

  arecNFT.timeLiquidized = event.block.timestamp.toI32()
  arecNFT.status = recData.status
  arecNFT.save()

  let artOverview = ARTOverview.load(arecNFT.artInfo)!
  artOverview.numNFTLiquidized = artOverview.numNFTLiquidized + 1
  artOverview.amountNFTLiquidized = artOverview.amountNFTLiquidized.plus(recData.amountREC)
  artOverview.save()

  let arecOverview = ARECOverview.load("AREC_VIEW")!
  arecOverview.numARECNFTLiquidized = arecOverview.numARECNFTLiquidized +1 
  arecOverview.amountARECNFTLiquidized = arecOverview.amountARECNFTLiquidized.plus(recData.amountREC)
  arecOverview.save()
}

// event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
export function handleTransfer(event: Transfer): void {
  let NFTID = event.params.tokenId.toString()
  let arecNFT = ARECNFT.load("AREC_NFT_" + NFTID.padStart(6,'0'))!
  arecNFT.owner = event.params.to
  arecNFT.save()
}
