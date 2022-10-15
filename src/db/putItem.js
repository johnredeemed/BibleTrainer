/* Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0

ABOUT THIS NODE.JS EXAMPLE: This example works with the AWS SDK for JavaScript (v3),
which is available at https://github.com/aws/aws-sdk-js-v3.

Purpose:
putItem.js demonstrates how to use the Amazon DynamoDB document client to put an item in a table.

Inputs (replace in code):
- TABLE_NAME
- primaryKey - The name of the primary key. For example, "title".
- VALUE_1: Value for the primary key. (The format for the datatype must match the schema. For example, if the primaryKey is a number, VALUE_1 has no inverted commas.)
- sortKey - The name of the sort key. Only required if the table has sort key. For example, "year".
- VALUE_2: Value for the primary key. (The format for the datatype must match the schema.)

Running the code:
node putItem.js
*/
// snippet-start:[dynamodb.JavaScript.movies.putItemV3]
// import { PutItemCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { PutItemCommand } from "@aws-sdk/client-dynamodb";
import { ddbClient } from "./libs/ddbClient.js";
// import { ddbDocClient } from "./libs/ddbDocClient.js";
import bcrypt from "bcrypt";

const TABLE_NAME = 'users'
export const putItem =  async (user, addr, pw, psgs) => {
  // Set the parameters.
  const hashedpw = await bcrypt.hash(pw, 10)
  // arrays need to be transformed into the Dynamo-accepted format (cf. https://stackoverflow.com/questions/53185405/putitem-with-dynamodb-using-lists-arrays)
  const formattedPsgs = psgs.map(x => { return { "S": x }});
  // possible to store a list of maps too. 
  // 'L': [
  //     'M': {'Passage': {'S': 'John 3:16'}, 'Familiarity': {'N': 2 }},
  //     'M': {'Passage': {'S': '1 Peter 3:16'}, 'Familiarity': {'N': 3 }}, 
  //  ]
  const params = {
    TableName: TABLE_NAME,
    Item: {
      username: {"S": user},
      email: {"S": addr},
      password: {"S": hashedpw},
      passages: {"L": formattedPsgs}
    },
  };

  try {
    const data = await ddbClient.send(new PutItemCommand(params));
    console.log("Success - item added or updated", data);
    return data 
  } catch (err) {
    console.log("Error message:", err.stack);
  }
}
putItem('test4','test@test.com', 'test',['John 3:16','Proverbs 3:5']);
// snippet-end:[dynamodb.JavaScript.movies.putItemV3]
