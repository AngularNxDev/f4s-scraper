import { mastra } from './mastra';

/**
 * Example usage of the Mastra gym scraper implementation
 * This demonstrates the complete workflow from URL discovery to content analysis
 */

async function runDiscoveryWorkflow() {
  console.log('🔍 Running URL Discovery Workflow...');
  
  try {
    // Get the discovery workflow
    const workflow = mastra.getWorkflow('discoveryWorkflow');
    const { runId, start } = workflow.createRun();

    console.log('Run ID:', runId);

    // Execute the workflow with a gym website URL
    const result = await start({
      inputData: {
        baseUrl: 'https://www.planetfitness.com'
      }
    });

    console.log('✅ Discovery Workflow Results:');
    console.log('- Success:', result.result?.success);
    console.log('- Number of URLs discovered:', result.result?.discoveredUrls?.length || 0);
    
    if (result.result?.discoveredUrls?.length > 0) {
      console.log('- Discovered URLs:');
      result.result.discoveredUrls.forEach((urlInfo, index) => {
        console.log(`  ${index + 1}. ${urlInfo.url}`);
        console.log(`     Priority: ${urlInfo.priority}`);
        console.log(`     Type: ${urlInfo.type}`);
        console.log(`     Reason: ${urlInfo.reason}`);
        console.log('');
      });
    }

    return result.result;
  } catch (error) {
    console.error('❌ Discovery workflow failed:', error);
    throw error;
  }
}

async function runContentAnalysisWorkflow() {
  console.log('📊 Running Content Analysis Workflow...');
  
  try {
    // Get the content analysis workflow
    const workflow = mastra.getWorkflow('contentAnalysisWorkflow');
    const { runId, start } = workflow.createRun();

    console.log('Run ID:', runId);

    // Execute the workflow with a specific URL
    const result = await start({
      inputData: {
        url: 'https://www.planetfitness.com/gyms',
        // previousContent: 'previous content here for comparison' // Optional
      }
    });

    console.log('✅ Content Analysis Results:');
    console.log('- Success:', result.result?.success);
    console.log('- Has Location Info:', result.result?.hasLocationInfo);
    console.log('- Confidence Score:', result.result?.confidence);
    console.log('- Number of locations found:', result.result?.locations?.length || 0);
    
    if (result.result?.locations?.length > 0) {
      console.log('- Found Locations:');
      result.result.locations.forEach((location, index) => {
        console.log(`  ${index + 1}. ${location.name}`);
        if (location.address) console.log(`     Address: ${location.address}`);
        if (location.phone) console.log(`     Phone: ${location.phone}`);
        if (location.status) console.log(`     Status: ${location.status}`);
        console.log(`     Confidence: ${location.confidence}`);
        console.log('');
      });
    }

    if (result.result?.changes?.length > 0) {
      console.log('- Detected Changes:');
      result.result.changes.forEach((change, index) => {
        console.log(`  ${index + 1}. ${change.type}: ${change.description}`);
      });
    }

    return result.result;
  } catch (error) {
    console.error('❌ Content analysis workflow failed:', error);
    throw error;
  }
}

async function useAgentsDirectly() {
  console.log('🤖 Using Agents Directly...');
  
  try {
    // Use discovery agent directly
    console.log('Using Discovery Agent:');
    const discoveryResponse = await mastra.getAgent('discoveryAgent').generate(
      'Analyze https://www.la-fitness.com for URLs that contain gym location information. Focus on finding location pages, store finders, or sitemap files.',
      {
        maxSteps: 5
      }
    );
    
    console.log('Discovery Agent Response:', discoveryResponse.text);
    console.log('');

    // Use analysis agent directly
    console.log('Using Analysis Agent:');
    const sampleContent = `
      Welcome to LA Fitness! Our new location at 123 Main Street, Downtown, CA 90210 is now open!
      Phone: (555) 123-4567
      Another location coming soon to 456 Oak Avenue, Westside, CA 90211
      Contact: (555) 987-6543
    `;
    
    const analysisResponse = await mastra.getAgent('analysisAgent').generate(
      `Analyze this content for gym location information: ${sampleContent}`,
      {
        maxSteps: 3
      }
    );
    
    console.log('Analysis Agent Response:', analysisResponse.text);
    
  } catch (error) {
    console.error('❌ Direct agent usage failed:', error);
    throw error;
  }
}

async function demonstrateFullPipeline() {
  console.log('🚀 Running Full Gym Scraper Pipeline...');
  console.log('=' .repeat(50));
  
  try {
    // Step 1: Discover URLs
    const discoveryResults = await runDiscoveryWorkflow();
    
    console.log('\n' + '-'.repeat(50));
    
    // Step 2: Analyze content if URLs were found
    if (discoveryResults?.discoveredUrls?.length > 0) {
      // Take the first high-priority URL for analysis
      const priorityUrl = discoveryResults.discoveredUrls.find(url => url.priority === 'high');
      const urlToAnalyze = priorityUrl || discoveryResults.discoveredUrls[0];
      
      console.log(`\n📍 Analyzing content from: ${urlToAnalyze.url}`);
      
      // Run content analysis on the discovered URL
      const analysisWorkflow = mastra.getWorkflow('contentAnalysisWorkflow');
      const { runId, start } = analysisWorkflow.createRun();
      
      const analysisResult = await start({
        inputData: {
          url: urlToAnalyze.url
        }
      });
      
      console.log('📊 Content Analysis on Discovered URL:');
      console.log('- Success:', analysisResult.result?.success);
      console.log('- Has Location Info:', analysisResult.result?.hasLocationInfo);
      console.log('- Locations Found:', analysisResult.result?.locations?.length || 0);
    }
    
    console.log('\n' + '-'.repeat(50));
    
    // Step 3: Demonstrate direct agent usage
    await useAgentsDirectly();
    
    console.log('\n✅ Full pipeline demonstration completed!');
    
  } catch (error) {
    console.error('❌ Full pipeline failed:', error);
  }
}

// Main execution
async function main() {
  console.log('🏋️‍♂️ Mastra Gym Scraper Demo');
  console.log('============================\n');
  
  try {
    await demonstrateFullPipeline();
  } catch (error) {
    console.error('Demo failed:', error);
    process.exit(1);
  }
}

// Export functions for individual testing
export {
  runDiscoveryWorkflow,
  runContentAnalysisWorkflow,
  useAgentsDirectly,
  demonstrateFullPipeline
};

// Run the demo if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

// Example function for monitoring a gym website for changes
async function monitorGymWebsite(baseUrl: string) {
  console.log(`🔄 Starting monitoring for: ${baseUrl}`);

  try {
    // Step 1: Discover URLs
    const discoveryWorkflow = await mastra.getWorkflow('gym-url-discovery-workflow');
    const discoveryRun = discoveryWorkflow.createRun();
    
    const discoveryResult = await discoveryRun.start({
      inputData: { baseUrl }
    });

    if (!discoveryResult.success) {
      console.error('Failed to discover URLs');
      return;
    }

    // Step 2: Analyze each discovered URL
    const analysisWorkflow = await mastra.getWorkflow('gym-content-analysis-workflow');
    const results = [];

    for (const discoveredUrl of discoveryResult.discoveredUrls) {
      console.log(`Analyzing: ${discoveredUrl.url}`);
      
      const analysisRun = analysisWorkflow.createRun();
      const analysisResult = await analysisRun.start({
        inputData: {
          url: discoveredUrl.url
        }
      });

      if (analysisResult.hasLocationInfo) {
        results.push({
          url: discoveredUrl.url,
          priority: discoveredUrl.priority,
          locations: analysisResult.locations,
          confidence: analysisResult.confidence
        });
      }

      // Add delay to be respectful to the website
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n📊 Monitoring Results:');
    console.log(`Found ${results.length} URLs with location information`);
    
    results.forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.url}`);
      console.log(`   Priority: ${result.priority}`);
      console.log(`   Locations: ${result.locations.length}`);
      console.log(`   Confidence: ${result.confidence}`);
    });

    return results;

  } catch (error) {
    console.error('❌ Error monitoring website:', error);
  }
} 