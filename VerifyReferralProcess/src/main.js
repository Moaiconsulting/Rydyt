import { Client, Databases, ID, Query } from 'node-appwrite';

export default async ({ req, res, log, error }) => {

  const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);

  const databaseId = process.env.DATABASE_ID;
  const referralsCollectionId = process.env.REFERRALS_COLLECTION_ID;

  try {

    const { referralCode, userId } = req.body;
    //getting referee details
    const refereeDetails = await databases.listDocuments(
      databaseId,
      referralsCollectionId,
      [
        Query.equal('generatedcode', referralCode)
      ]
    );

    if (refereeDetails.documents.length === 0) {
      return res.json({
        result: "Invalid Referral Code",
        status: 400,
      },
        res.status = 200
      );
    }

    // console.log("refereeDetails", refereeDetails);
    // console.log("refereeeDetails Document", refereeDetails.documents[0]);

    const { $id: documentId, usedcount, maxusagelimit, isvalid } = refereeDetails.documents[0]

    if (!isvalid) {
      return res.json({
        result: "Referral code is no longer valid",
        status: 400,
      },
        req.status = 200
      );
    }

    if (usedcount >= maxusagelimit) {
      return res.json({
        result: "Referral code has reached its usage limit",
        status: 400,
      },
        res.status = 200);
    }

    const updatedRefereeDetails = await databases.updateDocument(
      databaseId, // databaseId
      referralsCollectionId, // collectionId
      documentId, // documentId
      {
        usedcount: usedcount + 1,
        isvalid: usedcount + 1 >= maxusagelimit
          ? false
          : true,
      }, // data (optional)
      // [read("any")] // permissions (optional)
    );

    const userReferralDetails = await databases.listDocuments(
      databaseId,
      referralsCollectionId,
      [
        Query.equal('userid', userId)
      ]
    );

    const { $id: userDocumentId, generatedcode: generatedReferralcode } = userReferralDetails.documents[0];

    const updatedUserReferralDetails = await databases.updateDocument(
      databaseId, // databaseId
      referralsCollectionId, // collectionId
      userDocumentId, // documentId
      {
        referralcode: referralCode
      }, // data (optional)
      // [read("any")] // permissions (optional)
    );


    // `res.json()` is a handy helper for sending JSON
    return res.json({
      result: "Referral code validated and updated",
      referralCode: generatedReferralcode,
      status: 200,
    },
      res.status = 200);
  }
  catch (error) {
    return res.json({
      result: error.message,
      status: 500,
    },
      res.status = 500);
  }
};
