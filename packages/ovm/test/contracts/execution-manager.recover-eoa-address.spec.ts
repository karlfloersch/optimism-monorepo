import '../setup'

/* External Imports */
import { getLogger } from '@eth-optimism/core-utils'
import { Contract, ethers } from 'ethers'
import { createMockProvider, deployContract, getWallets } from 'ethereum-waffle'

/* Contract Imports */
import * as ExecutionManager from '../../build/contracts/ExecutionManager.json'

/* Internal Imports */
import { GAS_LIMIT, CHAIN_ID, OPCODE_WHITELIST_MASK } from '../../src/app'
import { DEFAULT_ETHNODE_GAS_LIMIT } from '../helpers'

export const abi = new ethers.utils.AbiCoder()

const log = getLogger('execution-manager-recover-eoa-address', true)

/*********
 * TESTS *
 *********/

describe('Execution Manager -- Recover EOA Address', () => {
  const provider = createMockProvider({ gasLimit: DEFAULT_ETHNODE_GAS_LIMIT })
  const [wallet] = getWallets(provider)
  // Useful constant
  const ONE_FILLED_BYTES_32 = '0x' + '11'.repeat(32)
  // Create pointers to our execution manager & simple copier contract
  let executionManager: Contract

  beforeEach(async () => {
    // Deploy ExecutionManager the normal way
    executionManager = await deployContract(
      wallet,
      ExecutionManager,
      [OPCODE_WHITELIST_MASK, '0x' + '00'.repeat(20), GAS_LIMIT, true],
      { gasLimit: DEFAULT_ETHNODE_GAS_LIMIT }
    )
  })

  describe('recoverEOAAddress', async () => {
    it('correctly recovers EOA addresses which are sent to contracts', async () => {
      // Generate a dummy tx to sign
      const eoaTx = {
        nonce: 1,
        gasLimit: GAS_LIMIT,
        gasPrice: 0,
        to: '0x' + '91'.repeat(20),
        value: 0,
        data: '0xdeadbeef',
        chainId: CHAIN_ID,
      }
      // Sign the message
      const signedMessage = await wallet.sign(eoaTx)
      // Extract signature
      const [v, r, s] = ethers.utils.RLP.decode(signedMessage).slice(-3)
      // Call the executionManager's recover address function
      const recoveredAddress = await executionManager.recoverEOAAddress(
        eoaTx.nonce,
        eoaTx.to,
        eoaTx.data,
        v,
        r,
        s
      )
      // Check that the recovered address matches the wallet address
      recoveredAddress.should.equal(wallet.address)
      // Done!
    })

    // TODO: Handle contract creation in a less error-prone way
    it('correctly recovers EOA addresses which create contracts', async () => {
      // Generate a dummy tx to sign
      const eoaTx = {
        nonce: 1,
        gasLimit: GAS_LIMIT,
        gasPrice: 0,
        value: 0,
        data: '0xdeadbeef',
        chainId: CHAIN_ID,
      }
      // Sign the message
      const signedMessage = await wallet.sign(eoaTx)
      // Extract signature
      const [v, r, s] = ethers.utils.RLP.decode(signedMessage).slice(-3)
      // Call the executionManager's recover address function
      const recoveredAddress = await executionManager.recoverEOAAddress(
        eoaTx.nonce,
        '0x' + '00'.repeat(20), // Replace the TO so that it makes a CREATE tx
        eoaTx.data,
        v,
        r,
        s
      )
      // Check that the recovered address matches the wallet address
      recoveredAddress.should.equal(wallet.address)
      // Done!
    })
  })
})
