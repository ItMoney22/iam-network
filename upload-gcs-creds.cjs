#!/usr/bin/env node

/**
 * Upload GCS credentials as environment variable to Railway
 */

const https = require('https');
const fs = require('fs');

const PROJECT_ID = 'c7733564-a9b1-4142-be94-cbe4ec47d45b';
const ENVIRONMENT_ID = 'c7590167-add6-4995-a453-a874c26ce18f';
const SERVICE_ID = 'ec2bd103-ad49-4cb5-bc9a-dff68ba32c2d'; // IAM Network service
const RAILWAY_TOKEN = 'rw_Fe26.2**7405e8a6bd8e6d04a047377fd6b9d9a2185be4b449050a47c05297932d3c4305*RDcc4LkkVzDLmKRatlZ0Dg*qfKLkldMqHjBzHx6UY05IZuz-hk5opTKylN4g0IJYrb_NDESTObNogN4YxfR9TvaMCWRfEpHlTVSeGqRFlxzpw*1763643677278*05c198ac872820eec94645780c708cf0a250f691352f12c5b7ac129c7548f30b*MWHmHP0nHalglhCS7Lc1RIJqYCFwdpXFyRLA14LblkQ';

function graphqlRequest(query, variables = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query, variables });

    const options = {
      hostname: 'backboard.railway.app',
      path: '/graphql/v2',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RAILWAY_TOKEN}`,
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          if (response.errors) {
            reject(new Error(JSON.stringify(response.errors)));
          } else {
            resolve(response.data);
          }
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function uploadGCSCredentials() {
  console.log('📦 Uploading GCS credentials to Railway...\n');

  // Read the GCS credentials file
  const gcsCredsPath = './gcp-service-account.json';
  const gcsCreds = fs.readFileSync(gcsCredsPath, 'utf8');

  console.log('✅ Read GCS credentials file');
  console.log(`   File size: ${gcsCreds.length} bytes\n`);

  // Set as environment variable
  const mutation = `
    mutation variableUpsert($input: VariableUpsertInput!) {
      variableUpsert(input: $input)
    }
  `;

  try {
    await graphqlRequest(mutation, {
      input: {
        projectId: PROJECT_ID,
        environmentId: ENVIRONMENT_ID,
        serviceId: SERVICE_ID,
        name: 'GCS_SERVICE_ACCOUNT_JSON',
        value: gcsCreds
      }
    });

    console.log('✅ GCS credentials uploaded as environment variable!');
    console.log('   Variable name: GCS_SERVICE_ACCOUNT_JSON\n');

    console.log('🚀 Now updating GOOGLE_APPLICATION_CREDENTIALS...');

    // Update the GOOGLE_APPLICATION_CREDENTIALS to use the env var
    await graphqlRequest(mutation, {
      input: {
        projectId: PROJECT_ID,
        environmentId: ENVIRONMENT_ID,
        serviceId: SERVICE_ID,
        name: 'GOOGLE_APPLICATION_CREDENTIALS',
        value: '' // We'll handle this in code instead
      }
    });

    console.log('✅ Configuration updated!\n');

    console.log('🎉 Done!');
    console.log('\n📊 Next step:');
    console.log('   The app will now use GCS_SERVICE_ACCOUNT_JSON environment variable');
    console.log('   Railway will automatically redeploy\n');

  } catch (err) {
    console.error('❌ Failed:', err.message);
    process.exit(1);
  }
}

uploadGCSCredentials();
