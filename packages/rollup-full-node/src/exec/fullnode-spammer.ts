import {
  add0x,
  getLogger,
  keccak256,
  numberToHexString,
  ZERO_ADDRESS,
} from '@eth-optimism/core-utils'
import { CHAIN_ID } from '@eth-optimism/ovm'

import { ethers, ContractFactory, Wallet, Contract, utils } from 'ethers'
import { resolve } from 'path'
import * as rimraf from 'rimraf'
import * as fs from 'fs'
import assert from 'assert'

/* Internal Imports */
import { FullnodeRpcServer, DefaultWeb3Handler } from '../../src/app'
import * as SimpleStorage from '../../test/contracts/build/untranspiled/SimpleStorage.json'
import { Web3RpcMethods } from '../../src/types'

const log = getLogger('fullnode-spammer')

const host = '0.0.0.0'
const port = 8545

// Create some constants we will use for storage
const storageKey = '0x' + '01'.repeat(32)
const storageValue = '0x' + '02'.repeat(32)

const getWallet = (httpProvider) => {
  const privateKey = '0x' + '60'.repeat(32)
  const wallet = new ethers.Wallet(privateKey, httpProvider)
  log.debug('Wallet address:', wallet.address)
  return wallet
}

const deploySimpleStorage = async (wallet: Wallet): Promise<Contract> => {
  const factory = new ContractFactory(
    SimpleStorage.abi,
    SimpleStorage.bytecode,
    wallet
  )

  // Deploy tx normally
  const simpleStorage = await factory.deploy()
  // Get the deployment tx receipt
  const deploymentTxReceipt = await wallet.provider.getTransactionReceipt(
    simpleStorage.deployTransaction.hash
  )

  return simpleStorage
}

const setAndGetStorage = async (
  simpleStorage: Contract,
  httpProvider,
  executionManagerAddress
): Promise<void> => {
  await setStorage(simpleStorage, httpProvider, executionManagerAddress)
  await getAndVerifyStorage(
    simpleStorage,
    httpProvider,
    executionManagerAddress
  )
}

const setStorage = async (
  simpleStorage: Contract,
  httpProvider,
  executionManagerAddress
): Promise<any> => {
  // Set storage with our new storage elements
  const tx = await simpleStorage.setStorage(
    executionManagerAddress,
    storageKey,
    storageValue
  )
  return httpProvider.getTransactionReceipt(tx.hash)
}

const getAndVerifyStorage = async (
  simpleStorage: Contract,
  httpProvider,
  executionManagerAddress
): Promise<void> => {
  // Get the storage
  const res = await simpleStorage.getStorage(
    executionManagerAddress,
    storageKey
  )
  // Verify we got the value!
  assert(res === storageValue)
}

/**
 * Creates an unsigned transaction.
 * @param {ethers.Contract} contract
 * @param {String} functionName
 * @param {Array} args
 */
export const getUnsignedTransactionCalldata = (
  contract,
  functionName,
  args
) => {
  return contract.interface.functions[functionName].encode(args)
}


export const beginSpam = async () => {
  await new Promise(r => setTimeout(r, 2000));
  console.log('THIS IS IT')
  const httpProvider = new ethers.providers.JsonRpcProvider(
    `http://${host}:${port}`
  )
  const executionManagerAddress = await httpProvider.send(
    'ovm_getExecutionManagerAddress',
    []
  )
  const wallet = getWallet(httpProvider)
  const simpleStorage = await deploySimpleStorage(wallet)

  const numSpamTxs = 5000
  log.info(`Spamming ${numSpamTxs} times`)
  // Now spam 1492 times
  for (let i = 0; i < numSpamTxs; i++) {
    const key = ethers.utils.formatBytes32String(i.toString())
    const value = ethers.utils.formatBytes32String(i.toString())
    const calldata = simpleStorage.interface.functions[
      'setStorage'
    ].encode([executionManagerAddress, key, value])

    const tx = {
      nonce: await wallet.getTransactionCount(),
      gasPrice: 0,
      gasLimit: 9999999999,
      to: executionManagerAddress,
      data: calldata,
      chainId: CHAIN_ID,
    }

    const signedTransaction = await wallet.sign(tx)

    const hash = await httpProvider.send(
      Web3RpcMethods.sendRawTransaction,
      [signedTransaction]
    )

    await httpProvider.waitForTransaction(hash)

    const returnedSignedTx = await httpProvider.send(
      Web3RpcMethods.getTransactionByHash,
      [hash]
    )

    const parsedSignedTx = utils.parseTransaction(signedTransaction)

    assert(JSON.stringify(parsedSignedTx) === JSON.stringify(returnedSignedTx), 'Signed transactions do not match!')
    log.info(`Spammed ${i} time`)
  }
}
