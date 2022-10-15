
The database named 'users' is created under BM's AWS account.

Contact BM to enable access to 'users' (steps to be taken: https://docs.aws.amazon.com/prescriptive-guidance/latest/patterns/configure-cross-account-access-to-amazon-dynamodb.html)

To set up DynamoDB (web service): 
https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/SettingUp.DynamoWebService.html

Familiarising yourself with DynamoDB using AWS CLI:
https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GettingStartedDynamoDB.html

AWS SDK and sub-packages (required for AWS SDK for JavaScript v3: https://betterdev.blog/aws-javascript-sdk-v3-usage-problems-testing/) already added to project via npm. See:
https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/CodeSamples.html

API examples: 
https://github.com/awsdocs/aws-doc-sdk-examples/tree/main/javascriptv3/example_code/dynamodb#code-examples

Snippet for initiating DynamoDBClient: 
----
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
// Set the AWS Region.
const REGION = "eu-west-2"; // London 
// Create an Amazon DynamoDB service client object.
const ddbClient = new DynamoDBClient({ region: REGION });
----

See ddb_createtable.js, putItem.js for examples making use of it. 

More help on AWS SDK for Javascript v3: https://docs.aws.amazon.com/sdk-for-javascript/index.html



----
Other useful tools/cmds:

> aws dynamodb scan --table-name Music > music.json 
> download noSQL Workbench: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/workbench.settingup.html
*Connecting existing table to noSQL workbench only possible for one of the three functionalities (operation builder). Not possible yet for Data Modeller and Data Visualizer yet: https://www.repost.aws/questions/QUjMiI1fVlSF6gb89ONJpsYw/import-existing-dynamo-db-table-schema-to-no-sql-workbenchs-data-model
