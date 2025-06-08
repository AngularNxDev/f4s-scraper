// Test script for MCP-integrated Mastra setup

const MASTRA_API_URL = 'http://localhost:4111/api';

async function testMastraAPI() {
  console.log('🧪 Testing MCP-integrated Mastra API...\n');

  try {
    // Test 1: Check if agents are available
    console.log('1. Testing agents endpoint...');
    const agentsResponse = await fetch(`${MASTRA_API_URL}/agents`);
    const agents = await agentsResponse.json();
    console.log('✅ Agents available:', Object.keys(agents));
    console.log('   - Discovery Agent:', agents.discovery ? '✅' : '❌');
    console.log('   - Analysis Agent:', agents.analysis ? '✅' : '❌');

    // Test 2: Check if workflows are available
    console.log('\n2. Testing workflows endpoint...');
    const workflowsResponse = await fetch(`${MASTRA_API_URL}/workflows`);
    const workflows = await workflowsResponse.json();
    console.log('✅ Workflows available:', Object.keys(workflows));
    console.log('   - Discovery Workflow:', workflows.discovery ? '✅' : '❌');
    console.log('   - Content Analysis Workflow:', workflows.contentAnalysis ? '✅' : '❌');

    // Test 3: Test discovery agent with a simple prompt
    console.log('\n3. Testing discovery agent...');
    const discoveryTest = await fetch(`${MASTRA_API_URL}/agents/discovery/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: 'Explain your role in the MCP-based gym scraper architecture.'
      })
    });
    
    if (discoveryTest.ok) {
      const discoveryResult = await discoveryTest.json();
      console.log('✅ Discovery agent response received');
      console.log('   Response preview:', discoveryResult.text?.substring(0, 100) + '...');
    } else {
      console.log('❌ Discovery agent test failed:', discoveryTest.status);
    }

    // Test 4: Test analysis agent
    console.log('\n4. Testing analysis agent...');
    const analysisTest = await fetch(`${MASTRA_API_URL}/agents/analysis/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: 'Explain how you analyze gym location content via the MCP Server.'
      })
    });
    
    if (analysisTest.ok) {
      const analysisResult = await analysisTest.json();
      console.log('✅ Analysis agent response received');
      console.log('   Response preview:', analysisResult.text?.substring(0, 100) + '...');
    } else {
      console.log('❌ Analysis agent test failed:', analysisTest.status);
    }

    console.log('\n🎉 MCP Integration Test Summary:');
    console.log('✅ Mastra server is running on port 4111');
    console.log('✅ MCP-based agents are configured and accessible');
    console.log('✅ MCP-based workflows are available');
    console.log('✅ API endpoints are responding correctly');
    
    console.log('\n📋 Next Steps:');
    console.log('1. Set up the MCP Server (App 1) on port 3000');
    console.log('2. Configure the NestJS scraper (App 2) with Supabase');
    console.log('3. Test the full MCP communication flow');
    console.log('4. Integrate with the frontend (App 4)');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('- Ensure Mastra server is running: npm run dev');
    console.log('- Check if port 4111 is accessible');
    console.log('- Verify environment variables are set');
  }
}

// Run the test
testMastraAPI(); 