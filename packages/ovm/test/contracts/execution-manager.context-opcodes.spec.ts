import { should } from '../setup'

/* External Imports */
import { Address } from '@eth-optimism/rollup-core'
import {
  getLogger,
  hexStrToNumber,
  remove0x,
  TestUtils,
} from '@eth-optimism/core-utils'

import { Contract, ContractFactory, ethers } from 'ethers'
import { createMockProvider, deployContract, getWallets } from 'ethereum-waffle'

/* Contract Imports */
import * as ExecutionManager from '../../build/contracts/ExecutionManager.json'
import * as ContextContract from '../../build/contracts/ContextContract.json'

/* Internal Imports */
import {
  manuallyDeployOvmContract,
  addressToBytes32Address,
  DEFAULT_ETHNODE_GAS_LIMIT,
  executeOVMCall,
  encodeRawArguments,
  encodeMethodId,
} from '../helpers'
import { GAS_LIMIT, OPCODE_WHITELIST_MASK } from '../../src/app'
import { fromPairs } from 'lodash'

export const abi = new ethers.utils.AbiCoder()

const log = getLogger('execution-manager-context', true)

const methodIds = fromPairs(
  [
    'callThroughExecutionManager',
    'executeCall',
    'getADDRESS',
    'getCALLER',
    'getGASLIMIT',
    'getQueueOrigin',
    'getTIMESTAMP',
    'ovmADDRESS',
    'ovmCALLER',
  ].map((methodId) => [methodId, encodeMethodId(methodId)])
)

/*********
 * TESTS *
 *********/

describe('Execution Manager -- Context opcodes', () => {
  const provider = createMockProvider({ gasLimit: DEFAULT_ETHNODE_GAS_LIMIT })
  const [wallet] = getWallets(provider)

  // Create pointers to our execution manager & simple copier contract
  let executionManager: Contract
  let contractAddress: Address
  let contract2Address: Address
  let contractAddress32: string
  let contract2Address32: string

  beforeEach(async () => {
    // Deploy ExecutionManager the normal way
    executionManager = await deployContract(
      wallet,
      ExecutionManager,
      [OPCODE_WHITELIST_MASK, '0x' + '00'.repeat(20), GAS_LIMIT, true],
      { gasLimit: DEFAULT_ETHNODE_GAS_LIMIT }
    )

    // Deploy SimpleCopier with the ExecutionManager
    contractAddress = await manuallyDeployOvmContract(
      wallet,
      provider,
      executionManager,
      ContextContract,
      [executionManager.address]
    )

    log.debug(`Contract address: [${contractAddress}]`)

    // Also set our simple copier Ethers contract so we can generate unsigned transactions
    const contract = new ContractFactory(
      ContextContract.abi as any,
      ContextContract.bytecode
    )

    // Deploy SimpleCopier with the ExecutionManager
    contract2Address = await manuallyDeployOvmContract(
      wallet,
      provider,
      executionManager,
      ContextContract,
      [executionManager.address]
    )

    log.debug(`Contract 2 address: [${contract2Address}]`)

    // Also set our simple copier Ethers contract so we can generate unsigned transactions
    const contract2 = new ContractFactory(
      ContextContract.abi as any,
      ContextContract.bytecode
    )

    contractAddress32 = addressToBytes32Address(contractAddress)
    contract2Address32 = addressToBytes32Address(contract2Address)
  })

  describe('ovmCALLER', async () => {
    it('reverts when CALLER is not set', async () => {
      await TestUtils.assertThrowsAsync(async () => {
        await executeCall([contractAddress32, methodIds.ovmCALLER])
      })
    })

    it('properly retrieves CALLER when caller is set', async () => {
      const result = await executeCall([
        contractAddress32,
        methodIds.callThroughExecutionManager,
        contract2Address32,
        methodIds.getCALLER,
      ])
      log.debug(`CALLER result: ${result}`)

      should.exist(result, 'Result should exist!')
      result.should.equal(contractAddress32, 'Addresses do not match.')
    })
  })

  describe('ovmADDRESS', async () => {
    it('reverts when ADDRESS is not set', async () => {
      await TestUtils.assertThrowsAsync(async () => {
        await executeCall([contractAddress32, methodIds.ovmADDRESS])
      })
    })

    it('properly retrieves ADDRESS when address is set', async () => {
      const result = await executeCall([
        contractAddress32,
        methodIds.callThroughExecutionManager,
        contract2Address32,
        methodIds.getADDRESS,
      ])

      log.debug(`ADDRESS result: ${result}`)

      should.exist(result, 'Result should exist!')
      result.should.equal(contract2Address32, 'Addresses do not match.')
    })
  })

  describe('ovmTIMESTAMP', async () => {
    it('reverts when TIMESTAMP is not set', async () => {
      await TestUtils.assertThrowsAsync(async () => {
        await executeCall([
          contractAddress32,
          methodIds.callThroughExecutionManager,
          contract2Address32,
          methodIds.getTIMESTAMP,
        ])
      })
    })

    it('properly retrieves TIMESTAMP when timestamp is set', async () => {
      const timestamp: number = 1582890922
      const result = await executeOVMCall(executionManager, 'executeCall', [
        timestamp,
        0,
        contractAddress32,
        methodIds.callThroughExecutionManager,
        contract2Address32,
        methodIds.getTIMESTAMP,
      ])

      log.debug(`TIMESTAMP result: ${result}`)

      should.exist(result, 'Result should exist!')
      hexStrToNumber(result).should.equal(timestamp, 'Timestamps do not match.')
    })
  })

  describe('ovmGASLIMIT', async () => {
    it('properly retrieves GASLIMIT', async () => {
      const result = await executeCall([
        contractAddress32,
        methodIds.callThroughExecutionManager,
        contract2Address32,
        methodIds.getGASLIMIT,
      ])

      log.debug(`GASLIMIT result: ${result}`)

      should.exist(result, 'Result should exist!')
      hexStrToNumber(result).should.equal(GAS_LIMIT, 'Gas limits do not match.')
    })
  })

  describe('ovmQueueOrigin', async () => {
    it('gets Queue Origin when it is 0', async () => {
      const queueOrigin: string = '00'.repeat(32)
      const result = await executeOVMCall(executionManager, 'executeCall', [
        0,
        queueOrigin,
        contractAddress32,
        methodIds.callThroughExecutionManager,
        contract2Address32,
        methodIds.getQueueOrigin,
      ])

      log.debug(`QUEUE ORIGIN result: ${result}`)

      should.exist(result, 'Result should exist!')
      remove0x(result).should.equal(queueOrigin, 'Queue origins do not match.')
    })

    it('properly retrieves Queue Origin when queue origin is set', async () => {
      const queueOrigin: string = '00'.repeat(30) + '1111'
      const result = await executeOVMCall(executionManager, 'executeCall', [
        0,
        queueOrigin,
        contractAddress32,
        methodIds.callThroughExecutionManager,
        contract2Address32,
        methodIds.getQueueOrigin,
      ])

      log.debug(`QUEUE ORIGIN result: ${result}`)

      should.exist(result, 'Result should exist!')
      remove0x(result).should.equal(queueOrigin, 'Queue origins do not match.')
    })
  })

  const executeCall = (args: any[]): Promise<string> => {
    return executeOVMCall(executionManager, 'executeCall', [
      encodeRawArguments([0, 0, ...args]),
    ])
  }
})
