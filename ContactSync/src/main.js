//approach2
// import { Client, Databases, Query } from 'node-appwrite';

// // This is your Appwrite function
// // It's executed each time we get a request
// export default async ({ req, res, log, error }) => {
//   // Initialize the Appwrite client
//   const client = new Client()
//     .setEndpoint('https://cloud.appwrite.io/v1')
//     .setProject(process.env.APPWRITE_PROJECT_ID)
//     .setKey(process.env.APPWRITE_API_KEY);

//   const databases = new Databases(client);

//   const databaseId = process.env.DATABASE_ID;
//   const userDetailsCollectionId = process.env.USER_DETAILS_COLLECTION_ID;

//   let inputJson;

//   try {
//     // Check if req.body is a string and parse it, otherwise assume it's already an object
//     if (typeof req.body === 'string') {
//       inputJson = JSON.parse(req.body);
//     } else {
//       inputJson = req.body;
//     }

//     // Ensure inputJson contains the key `inputJson` and is an array
//     if (!Array.isArray(inputJson.inputJson)) {
//       throw new Error('Invalid JSON structure: `inputJson` should be an array.');
//     }

//     inputJson = inputJson.inputJson; // Extract the array from the `inputJson` key

//   } catch (parseError) {
//     console.error("Error parsing JSON:", parseError);
//     return res.json({
//       status: 'error',
//       message: 'Invalid JSON input',
//     });
//   }

//   const checkArray = [];
//   const phoneToNameMap = new Map();
//   const resultMap = new Map();

//   // Collect all unique phone numbers and map them to names from input
//   for (const entry of inputJson) {
//     // if (!entry.phonenumber || !entry.name) {
//     //   console.error("Invalid entry format:", entry);
//     //   continue; // Skip this entry if it's invalid
//     // }

//     for (const phoneNumber of entry.phonenumber) {
//       if (!checkArray.includes(phoneNumber)) {
//         checkArray.push(phoneNumber);
//         phoneToNameMap.set(phoneNumber, entry.name);
//       }
//     }
//   }

//   console.log("phoneToNameMap", phoneToNameMap);

//   try {
//     const result = await databases.listDocuments(
//       databaseId,
//       userDetailsCollectionId,
//       [Query.contains("phonenumber", checkArray)] // Updated to use Query.in
//     );

//     // Process the results
//     if (result.documents && result.documents.length > 0) {
//       for (const doc of result.documents) {
//         if (doc.phonenumber && typeof doc.phonenumber === 'string' && doc.userid !== undefined) {
//           // Clean the phone number and map it to the input name
//           let cleanedNumber = doc.phonenumber.replace("+91", "");
//           const name = phoneToNameMap.get(cleanedNumber) || 'Unknown';
//           const useridString = doc.userid.toString();
//           resultMap.set(doc.phonenumber, { name, userid: useridString });
//         }
//       }
//     }
//   } catch (fetchError) {
//     console.error(`Error fetching data from database:`, fetchError);
//     return res.json({
//       status: 'error',
//       message: 'Error fetching data from database',
//     });
//   }

//   // Format the results
//   const formattedResults = [];
//   for (const [phoneNumber, data] of resultMap.entries()) {
//     formattedResults.push({
//       name: data.name,
//       phonenumber: phoneNumber,
//       userid: data.userid
//     });
//   }

//   console.log("Formatted Results", formattedResults);
//   return res.json({
//     status: 'success',
//     data: formattedResults
//   });
// }



// approach 1
// import { Client, Databases, Query } from 'node-appwrite';

// export default async ({ req, res, log, error }) => {
//   const client = new Client()
//     .setEndpoint('https://cloud.appwrite.io/v1')
//     .setProject(process.env.APPWRITE_PROJECT_ID)
//     .setKey(process.env.APPWRITE_API_KEY);

//   const databases = new Databases(client);

//   const databaseId = process.env.DATABASE_ID;
//   const userDetailsCollectionId = process.env.USER_DETAILS_COLLECTION_ID;

//   let inputJson;

//   try {
//     if (typeof req.body === 'string') {
//       inputJson = JSON.parse(req.body);
//     } else {
//       inputJson = req.body;
//     }

//     if (!Array.isArray(inputJson.inputJson)) {
//       throw new Error('Invalid JSON structure: inputJson should be an array.');
//     }

//     inputJson = inputJson.inputJson;
//   } catch (parseError) {
//     console.error("Error parsing JSON:", parseError);
//     return res.json({
//       status: 'error',
//       message: 'Invalid JSON input',
//     });
//   }

//   const checkArray = [];
//   const phoneToNameMap = new Map();
//   const resultMap = new Map();

//   for (const entry of inputJson) {
//     for (const phoneNumber of entry.phonenumber) {
//       if (!checkArray.includes(phoneNumber)) {
//         checkArray.push(phoneNumber);
//         phoneToNameMap.set(phoneNumber, entry.name);
//       }
//     }
//   }

//   console.log("phoneToNameMap", phoneToNameMap);

//   const pageSize = 25; // Appwrite fetch limit
//   let offset = 0;
//   let hasMoreData = true;

//   while (hasMoreData) {
//     try {
//       console.log("checkArray", checkArray);
//       const result = await databases.listDocuments(
//         databaseId,
//         userDetailsCollectionId,
//         [
//           Query.limit(pageSize),
//           Query.offset(offset),
//           Query.contains('phonenumber', checkArray) // Ensure this works as expected
//         ]
//       );

//       if (result.documents && result.documents.length > 0) {
//         for (const doc of result.documents) {
//           if (doc.phonenumber && typeof doc.phonenumber === 'string' && doc.userid !== undefined) {
//             let cleanedNumber = doc.phonenumber.replace("+91", "");
//             const name = phoneToNameMap.get(cleanedNumber) || 'Unknown';
//             const useridString = doc.userid.toString();
//             resultMap.set(doc.phonenumber, { name, userid: useridString });
//           }
//         }

//         // Update offset for next page
//         offset += pageSize;

//         // Check if we have more data to fetch
//         if (result.documents.length < pageSize) {
//           hasMoreData = false;
//         }
//       } else {
//         hasMoreData = false;
//       }
//     } catch (fetchError) {
//       console.error("Error fetching data from database:", fetchError);
//       return res.json({
//         status: 'error',
//         message: 'Error fetching data from database',
//       });
//     }
//   }

//   const formattedResults = [];
//   for (const [phoneNumber, data] of resultMap.entries()) {
//     formattedResults.push({
//       name: data.name,
//       phonenumber: phoneNumber,
//       userid: data.userid
//     });
//   }

//   console.log("Formatted Results", formattedResults);
//   return res.json({
//     status: 'success',
//     data: formattedResults
//   });
// };

// approach3
import { Client, Databases, Query } from 'node-appwrite';

export default async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);

  const databaseId = process.env.DATABASE_ID;
  const userDetailsCollectionId = process.env.USER_DETAILS_COLLECTION_ID;

  let inputJson;

  try {
    if (typeof req.body === 'string') {
      inputJson = JSON.parse(req.body);
    } else {
      inputJson = req.body;
    }

    if (!Array.isArray(inputJson.inputJson)) {
      throw new Error('Invalid JSON structure: inputJson should be an array.');
    }

    inputJson = inputJson.inputJson;
  } catch (parseError) {
    console.error("Error parsing JSON:", parseError);
    return res.json({
      status: 'error',
      message: 'Invalid JSON input',
    });
  }

  const phoneToNameMap = new Map();
  const resultMap = new Map();
  const BATCH_SIZE = 100; // Batch size for splitting queries

  // Collect all unique phone numbers and map them to names from input
  for (const entry of inputJson) {
    for (const phoneNumber of entry.phonenumber) {
      phoneToNameMap.set(phoneNumber, entry.name);
    }
  }

  const phoneNumbers = Array.from(phoneToNameMap.keys());
  const batches = [];

  // Split phone numbers into batches
  for (let i = 0; i < phoneNumbers.length; i += BATCH_SIZE) {
    const batch = phoneNumbers.slice(i, i + BATCH_SIZE);
    batches.push(batch);
  }

  try {
    for (const batch of batches) {
      const result = await databases.listDocuments(
        databaseId, // database ID
        userDetailsCollectionId, // collection ID
        [Query.contains("phonenumber", batch)]
      );

      // Process the results for the current batch
      if (result.documents && result.documents.length > 0) {
        for (const doc of result.documents) {
          if (doc.phonenumber && typeof doc.phonenumber === 'string' && doc.userid !== undefined) {
            let cleanNum = doc.phonenumber;
            let phoneNumber = cleanNum.replace("+91", "");
            const name = phoneToNameMap.get(phoneNumber) || 'Unknown';
            const useridString = doc.userid.toString();
            resultMap.set(doc.phonenumber, { name, userid: useridString });
          }
        }
      }
    }
  } catch (error) {
    console.error(`Error fetching data:`, error);
  }

  // Format the results
  const formattedResults = [];
  for (const [phoneNumber, data] of resultMap.entries()) {
    formattedResults.push({
      name: data.name,
      phonenumber: phoneNumber,
      userid: data.userid
    });
  }
  console.log("format", formattedResults);

  return res.json({
    status: 'success',
    data: formattedResults
  });
};

