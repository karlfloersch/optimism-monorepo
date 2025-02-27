import '../setup'

/* External Imports */
import { Address } from '@eth-optimism/rollup-core'
import { getLogger, padToLength, ZERO_ADDRESS } from '@eth-optimism/core-utils'

import { Contract, ContractFactory, ethers } from 'ethers'
import { createMockProvider, deployContract, getWallets } from 'ethereum-waffle'
import * as ethereumjsAbi from 'ethereumjs-abi'

/* Contract Imports */
import * as ExecutionManager from '../../build/contracts/ExecutionManager.json'
import * as DummyContract from '../../build/contracts/DummyContract.json'

/* Internal Imports */
import {
  manuallyDeployOvmContract,
  getUnsignedTransactionCalldata,
  DEFAULT_ETHNODE_GAS_LIMIT,
  ZERO_UINT,
} from '../helpers'
import { GAS_LIMIT, CHAIN_ID, OPCODE_WHITELIST_MASK } from '../../src/app'

export const abi = new ethers.utils.AbiCoder()

const log = getLogger('execution-manager-calls', true)

/*********
 * TESTS *
 *********/

const unsignedCallMethodId: string = ethereumjsAbi
  .methodID('executeUnsignedEOACall', [])
  .toString('hex')

describe('Execution Manager -- Call opcodes', () => {
  const provider = createMockProvider({ gasLimit: DEFAULT_ETHNODE_GAS_LIMIT })
  const [wallet] = getWallets(provider)
  // Create pointers to our execution manager & simple copier contract
  let executionManager: Contract
  let dummyContract: ContractFactory
  let dummyContractAddress: Address

  beforeEach(async () => {
    // Before each test let's deploy a fresh ExecutionManager and DummyContract

    // Deploy ExecutionManager the normal way
    executionManager = await deployContract(
      wallet,
      ExecutionManager,
      [OPCODE_WHITELIST_MASK, '0x' + '00'.repeat(20), GAS_LIMIT, true],
      { gasLimit: DEFAULT_ETHNODE_GAS_LIMIT }
    )

    // Deploy SimpleCopier with the ExecutionManager
    dummyContractAddress = await manuallyDeployOvmContract(
      wallet,
      provider,
      executionManager,
      DummyContract,
      []
    )

    log.debug(`Contract address: [${dummyContractAddress}]`)

    // Also set our simple copier Ethers contract so we can generate unsigned transactions
    dummyContract = new ContractFactory(
      DummyContract.abi as any,
      DummyContract.bytecode
    )
  })

  describe('executeNonEOACall', async () => {
    it('properly executes a raw call -- 0 param', async () => {
      // Create the variables we will use for setStorage
      const intParam = 0
      const bytesParam = '0xdeadbeef'
      // Generate our tx calldata
      const calldata = getUnsignedTransactionCalldata(
        dummyContract,
        'dummyFunction',
        [intParam, bytesParam]
      )
      const nonce = await executionManager.getOvmContractNonce(wallet.address)
      const transaction = {
        nonce,
        gasLimit: GAS_LIMIT,
        gasPrice: 0,
        to: dummyContractAddress,
        value: 0,
        data: calldata,
        chainId: CHAIN_ID,
      }

      // Call using Ethers
      const tx = await executionManager.executeUnsignedEOACall(
        0,
        0,
        transaction.to,
        transaction.data,
        ZERO_ADDRESS,
        true
      )
      await provider.waitForTransaction(tx.hash)
    })
  })

  describe('executeEOACall', async () => {
    it('properly executes a raw call -- 0 param', async () => {
      // Create the variables we will use for setStorage
      const intParam = 0
      const bytesParam = '0xdeadbeef'
      // Generate our tx calldata
      const calldata = getUnsignedTransactionCalldata(
        dummyContract,
        'dummyFunction',
        [intParam, bytesParam]
      )
      const nonce = await executionManager.getOvmContractNonce(wallet.address)
      const transaction = {
        nonce,
        gasLimit: GAS_LIMIT,
        gasPrice: 0,
        to: dummyContractAddress,
        value: 0,
        data: calldata,
        chainId: CHAIN_ID,
      }
      const signedMessage = await wallet.sign(transaction)
      const [v, r, s] = ethers.utils.RLP.decode(signedMessage).slice(-3)

      // Call using Ethers
      const tx = await executionManager.executeEOACall(
        0,
        0,
        transaction.nonce,
        transaction.to,
        transaction.data,
        padToLength(v, 4),
        padToLength(r, 64),
        padToLength(s, 64)
      )
      await provider.waitForTransaction(tx.hash)
    })

    it('increments the senders nonce', async () => {
      // Create the variables we will use for setStorage
      const intParam = 0
      const bytesParam = '0xdeadbeef'
      // Generate our tx calldata
      const calldata = getUnsignedTransactionCalldata(
        dummyContract,
        'dummyFunction',
        [intParam, bytesParam]
      )
      const nonce = await executionManager.getOvmContractNonce(wallet.address)
      const transaction = {
        nonce,
        gasLimit: GAS_LIMIT,
        gasPrice: 0,
        to: dummyContractAddress,
        value: 0,
        data: calldata,
        chainId: CHAIN_ID,
      }
      const signedMessage = await wallet.sign(transaction)
      const [v, r, s] = ethers.utils.RLP.decode(signedMessage).slice(-3)

      // Call using Ethers
      const tx = await executionManager.executeEOACall(
        0,
        0,
        transaction.nonce,
        transaction.to,
        transaction.data,
        v,
        r,
        s
      )
      await provider.waitForTransaction(tx.hash)
      const nonceAfter = await executionManager.getOvmContractNonce(
        wallet.address
      )
      nonceAfter.should.equal(parseInt(nonce, 10) + 1)
    })

    it('properly executes a raw call -- 1 param', async () => {
      const intParam = 1
      const bytesParam = '0xdeadbeef'
      // Generate our tx calldata
      const calldata = getUnsignedTransactionCalldata(
        dummyContract,
        'dummyFunction',
        [intParam, bytesParam]
      )
      const nonce = await executionManager.getOvmContractNonce(wallet.address)
      const transaction = {
        nonce,
        gasLimit: GAS_LIMIT,
        gasPrice: 0,
        to: dummyContractAddress,
        value: 0,
        data: calldata,
        chainId: CHAIN_ID,
      }
      const signedMessage = await wallet.sign(transaction)
      const [v, r, s] = ethers.utils.RLP.decode(signedMessage).slice(-3)

      // Call using Ethers
      const tx = await executionManager.executeEOACall(
        0,
        0,
        transaction.nonce,
        transaction.to,
        transaction.data,
        padToLength(v, 4),
        padToLength(r, 64),
        padToLength(s, 64)
      )
      await provider.waitForTransaction(tx.hash)
    })

    it('reverts when it makes a call that reverts', async () => {
      // Generate our tx internalCalldata
      const internalCalldata = getUnsignedTransactionCalldata(
        dummyContract,
        'dummyRevert',
        []
      )

      const calldata = getUnsignedTransactionCalldata(
        executionManager,
        'executeUnsignedEOACall',
        [
          ZERO_UINT,
          ZERO_UINT,
          dummyContractAddress,
          internalCalldata,
          wallet.address,
          true,
        ]
      )
      const nonce = await wallet.getTransactionCount()

      let failed = false
      try {
        await wallet.provider.call({
          nonce,
          gasLimit: GAS_LIMIT,
          gasPrice: 0,
          to: executionManager.address,
          value: 0,
          data: calldata,
          chainId: CHAIN_ID,
        })
      } catch (e) {
        log.debug(JSON.stringify(e) + '  ' + e.stack)
        failed = true
      }

      failed.should.equal(true, `This call should have reverted!`)
    })

    it('reverts when it makes a call that fails a require', async () => {
      // Generate our tx internalCalldata
      const internalCalldata = getUnsignedTransactionCalldata(
        dummyContract,
        'dummyFailingRequire',
        []
      )

      const calldata = getUnsignedTransactionCalldata(
        executionManager,
        'executeUnsignedEOACall',
        [
          ZERO_UINT,
          ZERO_UINT,
          dummyContractAddress,
          internalCalldata,
          wallet.address,
          true,
        ]
      )
      const nonce = await wallet.getTransactionCount()

      let failed = false
      try {
        await wallet.provider.call({
          nonce,
          gasLimit: GAS_LIMIT,
          gasPrice: 0,
          to: executionManager.address,
          value: 0,
          data: calldata,
          chainId: CHAIN_ID,
        })
      } catch (e) {
        log.debug(JSON.stringify(e) + '  ' + e.stack)
        failed = true
      }

      failed.should.equal(true, `This call should have reverted!`)
    })
  })
})
