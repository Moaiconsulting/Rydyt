import { Client, Databases, ID, Users, Permission, Role, Teams } from 'node-appwrite';

// This is your Appwrite function
// It's executed each time we get a request
export default async ({ req, res, log, error }) => {
  // Why not try the Appwrite SDK?
  //
  const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);
  const users = new Users(client);
  const teams = new Teams(client);

  const databaseId = process.env.DATABASE_ID;
  const referralsCollectionId = process.env.REFERRALS_COLLECTION_ID;
  const userDetailsCollectionId = process.env.USER_DETAILS_COLLECTION_ID;

  // You can log messages to the console
  console.log("request", req);
  if (!req.body) {
    throw Error('user not created properly');
  }
  const { phone, $id: userId } = req.body

  //   const promise = users.updateLabels(
  //     userId,
  //     [ 'member' ]
  // );

  const GettingPreferences = await users.getPrefs(
    userId // userId
  );
  console.log("gettingPreferences>>>>>>>>>", GettingPreferences);

  const { referralPassed } = GettingPreferences;
  if (!referralPassed) {

    const teamId = process.env.RYDYT_MEMBER_TEAMS_ID;

    const userEmailUpdate = await users.updateEmail(
      userId, // userId
      `${userId}@rydyt.com` // email
    );

    const result = await teams.createMembership(
      teamId, // teamId
      ['rydyt_user'], // roles
      `${userId}@rydyt.com`, // email (optional)
      userId, // userId (optional)
      // phone, // phone (optional)
      // 'https://example.com', // url (optional)
      // '<NAME>' // name (optional)
    );


    const generateReferralCode = (length) =>
      Array.from({ length },
        () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
          .charAt(Math.floor(Math.random() * 36))).join('');
    // Insert referral data
    await databases.createDocument(
      databaseId,
      referralsCollectionId,
      ID.unique(),
      {
        'referralid': ID.unique(),
        'userid': userId,
        'generatedcode': generateReferralCode(6),
        'usedcount': 0,
        'maxusagelimit': 10,
        'isvalid': true,
        'createdat': new Date().toISOString(),
        'updatedat': new Date().toISOString()
      },//data
      [
        // Permission.write(Role.team(teamId, ['rydyt_user'])),
        Permission.read(Role.team(teamId, ['rydyt_user'])),
        Permission.update(Role.team(teamId, ['rydyt_user']))
      ]
    );


    await databases.createDocument(
      databaseId,
      userDetailsCollectionId,
      ID.unique(),
      {
        'detailsid': ID.unique(),
        'phonenumber': phone,
        'userid': userId,
        'emailid':`${userId}@rydyt.com`,
        'stage': 0
      },//data
      [
        // Permission.write(Role.team(teamId, ['rydyt_user'])),
        Permission.read(Role.team(teamId, ['rydyt_user'])),
        Permission.update(Role.team(teamId, ['rydyt_user']))
      ]
    );

    // `res.json()` is a handy helper for sending JSON
    return res.json({
      result: "Data inserted in respective tables succesfully.",
      status: 200,
    },
      res.status = 200);

  }
};
