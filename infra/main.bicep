targetScope = 'subscription'

@minLength(1)
@maxLength(64)
@description('Name of the azd environment — used to derive resource names.')
param environmentName string

@minLength(1)
@description('Primary location for all resources.')
param location string

// --- Application configuration (passed through from azd env / .env) ---
param azureOpenAiEndpoint string = ''
@secure()
param azureOpenAiApiKey string = ''
param azureOpenAiDeployment string = ''
param azureOpenAiApiVersion string = ''
@secure()
param githubMcpToken string = ''
param googleClientId string = ''
@secure()
param googleClientSecret string = ''
param googleRedirectUri string = ''

var tags = { 'azd-env-name': environmentName }
var resourceToken = toLower(uniqueString(subscription().id, environmentName, location))

resource rg 'Microsoft.Resources/resourceGroups@2024-03-01' = {
  name: 'rg-${environmentName}'
  location: location
  tags: tags
}

module resources 'resources.bicep' = {
  name: 'resources'
  scope: rg
  params: {
    location: location
    tags: tags
    resourceToken: resourceToken
    azureOpenAiEndpoint: azureOpenAiEndpoint
    azureOpenAiApiKey: azureOpenAiApiKey
    azureOpenAiDeployment: azureOpenAiDeployment
    azureOpenAiApiVersion: azureOpenAiApiVersion
    githubMcpToken: githubMcpToken
    googleClientId: googleClientId
    googleClientSecret: googleClientSecret
    googleRedirectUri: googleRedirectUri
  }
}

output AZURE_LOCATION string = location
output AZURE_CONTAINER_REGISTRY_ENDPOINT string = resources.outputs.AZURE_CONTAINER_REGISTRY_ENDPOINT
output WEB_URI string = resources.outputs.WEB_URI
output SERVICE_WEB_NAME string = resources.outputs.SERVICE_WEB_NAME
