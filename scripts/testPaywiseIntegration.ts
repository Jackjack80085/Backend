import { PaywiseService } from '../src/services/paywise.service'
const paywiseService = new PaywiseService()

async function testPaywiseIntegration() {
  console.log('Testing Paywise Integration...\n')

  try {
    console.log('1. Testing token generation...')
    // Accessing private method via any is acceptable for quick test
    const token = await (paywiseService as any).getToken()
    console.log('✅ Token generated:', token ? token.substring(0, 20) + '...' : '<none>')

    console.log('\n2. Testing collection initiation...')
    const txId = 'test_' + Date.now()
    const result = await paywiseService.initiateCollection({
      transactionId: txId,
      amount: 100.0,
      userEmail: 'test@example.com',
      userPhone: '9876543210'
    })

    console.log('✅ Collection initiated:', result)

    console.log('\n3. Testing status check...')
    const status = await paywiseService.checkCollectionStatus({ senderId: txId })
    console.log('✅ Status:', status)

    console.log('\nAll Paywise tests completed.')
    process.exit(0)
  } catch (err: any) {
    console.error('Paywise integration test failed:', err)
    process.exit(1)
  }
}

testPaywiseIntegration()
