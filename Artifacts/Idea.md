## PROBLEM STATEMENT

My organisation has multiple software projects, Multiple Frontend (NextJs), Multiple Backend Apps (Dotnet and Node), and they use huge ENVs. We have a large scale architecture. Where we deploy mulitple stages, like Dev, Test, Stage, Prelive and Prod. That too can have multiple variants for different clients FeatureA-Dev, FeatureB-Dev, ClientA-Prelive, ClientB-Prelive, ClientA-Prod, ClientB-Prod,  etc.

In such complex architecture the problem of redundancy arrives in the management of env variables. If something changes we need to update in multiple places. Like AWS Keys, we have two different AWS Accounts, one for DEV and Another for PROD / PRELIVE / DEMO, etc If keys are changed on PROD, it should be updated for all the child deployments.

## Idea
I want to create a web app to manage envs, The users comes and starts configuring their projects, and configure their overrides. One project can be deployed with combination of mulitple overrides as well. After configuring overrides user will configure the keys, These keys are global and any project can use them by default but there should be an option to restrict those keys to specific projects. And the configuration is done.

After the entire configuration is done, User can define project level env schema. On that page they can have n number of keys, for each key user can select one or more overrides, for each override the user can select one or more override option, or they can add a new option for that override right from here.
After this, the can generate env form, which will ask all the values for all the overrides at once. There will be an option to group values, by Keys (All overrides of key will be place together) or by overrides (All keys of an override will be placed together) to fill at once.

Once that is done, the user can generate an env for any project by selecting the n number of overrides and one option for each override.
NextJs-Patient > AWS-ACCOUNT (DEV) > STAGE (PRELIVE) > CLIENT (CLIENT-A)

### Entities Involved
1. **Projects**: These are the project the environment variables are shared between
    1. **Examples** 
        * NextJs-Main-Portal
        * NextJs-Patient-Portal
        * Nextjs-Frontdesk-Portal
        * Dotnet-Service
        * Node-Patient-Service
        * Node-Admin-Service
        * Document-Processing-Ai-Lambda
        * Chat-Python-Service
    2. **Attributes**
        * Name (String)
        * Description (String)
        * Tags (Key-Value)
        * Technology (Array of Strings) : ["React","NextJs", "Tailwind"]
2. **Overrides**: These are the overrides any project can have, These are different deployments the projects can have. One project can have multiple level of overrides, AWS>BRANCH>CLIENT.
    1. **Examples** 
        * Branch
        * Release-Version
        * Feature
        * Stages (DEVELOPMENT / DEMO / PRELIVE / PRODUCTION)
        * Clients
        * AWS Account
    2. **Attributes**
        * Name (String) (Example: AWS Accouunt)
        * Overrides (Example: DEVELOPMENT, PRODUCTION, CLIENT)
        * Description (String)
        * Tags (Key-Value)
3. **ENV Schema**: These are the ENV keys this proeject requires
    1. **Examples** 
        * AWS_ACCESS_KEY - Might only be overriden based on AWS Account override
        * AWS_SECRET_KEY - Might only be overriden based on AWS Account override
        * API_KEY - Might remain same for all
        * NODE_SERVER_URL - Might change for each client
        * SERVER_URL - Might change for different stages only
    2. **Attributes**
        * Name (String)
        * Description (String)
        * Tags (Key-Value)
        * Overrides (List of overrides this Key supports)

### Core Requirements
1. Since it's condifential information we will not store anything.
2. On every change implement a mechanism to store the information in the localStorage to preserve
4. Option to backup. User can download a backup file which will contain all the configuration they have done as a large json.
5. Option to load. User can use the downloaded json dump file to restore all the configuration they've done. Show a prompt that current configuration will be lost if they load a new configuration.
6. Do not allow multiple tabs, if one tab is open do not let the user open another tab for our app, if they prompt them to switch to the already opened tab, and close current tab as they hit navigate.