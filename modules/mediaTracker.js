const fs = require("fs");
const path = require("path");

const mediaCountsPath = path.join(__dirname, "../data/mediaCounts.json");
let mediaCounts = require(mediaCountsPath);

const cooldownsPath = path.join(__dirname, "../data/cooldowns.json");
const weightsPath = path.join(__dirname, "../data/responseWeights.json");

// Load cooldowns from JSON file if it exists
let cooldowns = new Map();
if (fs.existsSync(cooldownsPath)) {
  const savedCooldowns = JSON.parse(fs.readFileSync(cooldownsPath, "utf-8"));
  cooldowns = new Map(Object.entries(savedCooldowns));
}

// Load weights from JSON file if it exists
let responseWeights = {};
if (fs.existsSync(weightsPath)) {
  responseWeights = JSON.parse(fs.readFileSync(weightsPath, "utf-8"));
}

// Cooldown management
const COOLDOWN_SECONDS = 60 * 5; // Cooldown in seconds

// Define role IDs for gender roles
const MALE_ROLE_ID = "1258269619815190598";
const FEMALE_ROLE_ID = "1258269646172192831";
const TRANS_ROLE_ID = "1258269670939562068"; // Generic trans role for both MtF and FtM

// Define arrays of possible responses for each gender role
const maleResponses = [
  "Phew! That was a huge load... Good job, hot stuff!",
  "Oh my goodness, you really were pent-up, huh? Good job, baby~",
  "Oh, my look at all that cum well done, gooner :heart:",
  "Wow, you really blew your load, huh? Good job, big boy~ ",
];

const femaleResponses = [
  "Oh, wow! That was a creamy orgasm! Good job, sweetie. :kiss:",
  "Oh my goodness, you really squirted a lot, huh? Good job, cutie~",
  "Oh, wow, you really let it all out~ Good job, darling~",
  "Mmmf, you had such a big release... Good job, lovely~",
];

const mtfResponses = [
  "Oh, my look at all that cum~ Well done, goonette :heart:",
  "Wow, you blew such a yummy load! Good job, big girl~",
];

const ftmResponses = [
  "Oh my goodness~ You made such a mess with that load~! :kiss:",
];

const genderlessResponses = [
  "That was a brain-numbing orgasm~",
  "Absolutely brain-melting~",
];

// Function to determine the correct suffix for the ordinal number
function getOrdinalSuffix(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

function shuffle(array) {
  let currentIndex = array.length;

  // While there remain elements to shuffle...
  while (currentIndex != 0) {
    // Pick a remaining element...
    let randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
  return array;
}

// Function to save cooldowns to the JSON file
function saveCooldowns() {
  const cooldownsObject = Object.fromEntries(cooldowns);
  fs.writeFileSync(cooldownsPath, JSON.stringify(cooldownsObject, null, 2));
}

// Initialize weights for all responses if not already done
function initializeWeights() {
  [
    maleResponses,
    femaleResponses,
    mtfResponses,
    ftmResponses,
    genderlessResponses,
  ].forEach((responseArray) => {
    responseArray.forEach((response) => {
      if (!(response in responseWeights)) {
        responseWeights[response] = 1; // Initial weight
      }
    });
  });
}

// Function to save weights to the JSON file
function saveWeights() {
  fs.writeFileSync(weightsPath, JSON.stringify(responseWeights, null, 2));
}

// Function to get a weighted random element from an array
function getWeightedRandomResponse(array) {
  // Calculate total weight
  const totalWeight = array.reduce(
    (sum, response) => sum + responseWeights[response],
    0
  );

  // Generate a random number between 0 and totalWeight
  let randomNum = Math.random() * totalWeight;

  // Select the response based on the random number
  for (const response of array) {
    randomNum -= responseWeights[response];
    if (randomNum <= 0) {
      // Decrease weight of the chosen response
      responseWeights[response] = Math.max(1, responseWeights[response] - 1); // Prevent weight from going below 1
      return response;
    }
  }

  // Fallback in case something goes wrong
  return array[array.length - 1];
}

// Regular expression to detect URLs
const urlRegex = /(https?:\/\/[^\s]+)/g;

// Define role IDs and thresholds
const ROLE_THRESHOLDS = [
  { roleId: "1321885793136017418", threshold: 10 },
  { roleId: "1321886135261204551", threshold: 40 },
  { roleId: "1321886606160039996", threshold: 100 },
  { roleId: "1321893471476383794", threshold: 400 },
  { roleId: "max", threshold: 750 },
];

// Define reaction emoji ids
const REACTION_EMOJI_IDS = [
  "1268919710951538749",
  "1268919795550650398",
  "1268922120075739217",
  "1259909353021112330",
  "1258566623275520052",
];

// Function to update user roles based on media count
async function updateRoles(member, mediaCount) {
  const guild = member.guild; // Get the guild object

  for (const { roleId, threshold } of ROLE_THRESHOLDS) {
    // Skip validation for "max" since it's a special case
    if (roleId !== "max" && !guild.roles.cache.has(roleId)) {
      console.error(`Role ID ${roleId} does not exist in the guild.`);
      continue; // Skip to the next role in the array
    }

    if (roleId === "max") {
      if (mediaCount >= threshold) {
        const hasMaleRole = member.roles.cache.has(MALE_ROLE_ID);
        const hasFemaleRole = member.roles.cache.has(FEMALE_ROLE_ID);
        const hasTransRole = member.roles.cache.has(TRANS_ROLE_ID);
        let maxRoleId;
        if (hasMaleRole) {
          maxRoleId = "1321894282210316349".trim();
        } else if (hasFemaleRole) {
          maxRoleId = "1321894908998713444".trim();
        } else if (hasTransRole) {
          maxRoleId = "1321894282210316349".trim();
        }

        if (maxRoleId && !guild.roles.cache.has(maxRoleId)) {
          console.error(
            `Max role ID ${maxRoleId} does not exist in the guild.`
          );
          continue; // Skip if the max role ID does not exist
        }

        if (maxRoleId && !member.roles.cache.has(maxRoleId)) {
          await member.roles.add(maxRoleId);
          console.log(`Added role ${maxRoleId} to user ${member.id}`);
        }
      }
    } else {
      if (mediaCount >= threshold) {
        if (!member.roles.cache.has(roleId)) {
          await member.roles.add(roleId);
          console.log(`Added role ${roleId} to user ${member.id}`);
        }
        // Remove any roles with lower thresholds
        for (const {
          roleId: lowerRoleId,
          threshold: lowerThreshold,
        } of ROLE_THRESHOLDS) {
          if (
            lowerThreshold < threshold &&
            member.roles.cache.has(lowerRoleId)
          ) {
            try {
              await member.roles.remove(lowerRoleId);
              console.log(
                `Removed lower threshold role ${lowerRoleId} from user ${member.id}`
              );
            } catch (error) {
              console.error(
                `Failed to remove lower threshold role ${lowerRoleId} from user ${member.id}:`,
                error
              );
            }
          }
        }
      } else {
        if (member.roles.cache.has(roleId)) {
          await member.roles.remove(roleId);
          console.log(`Removed role ${roleId} from user ${member.id}`);
        }
      }
    }
  }

  // Final redundant check to ensure user only has one appropriate role
  let assignedRole = null;
  for (const { roleId, threshold } of ROLE_THRESHOLDS) {
    if (roleId !== "max") {
      if (mediaCount >= threshold) {
        if (!member.roles.cache.has(roleId)) {
          await member.roles.add(roleId);
          console.log(
            `Redundant check: Added role ${roleId} to user ${member.id}`
          );
        }
        assignedRole = roleId; // Track the role assigned
      }
    }
  }

  // Ensure no conflicting roles remain
  for (const { roleId } of ROLE_THRESHOLDS) {
    if (
      roleId !== "max" &&
      roleId !== assignedRole &&
      member.roles.cache.has(roleId)
    ) {
      await member.roles.remove(roleId);
      console.log(
        `Ensured single role: Removed conflicting role ${roleId} from user ${member.id}`
      );
    }
  }
}

// Function to handle media messages
async function handleMediaMessage(message) {
  // Ignore messages from the bot itself
  if (message.author.bot) return;

  const CHANNEL_ID = "1257058272918110208";

  // Check if the message is in the specific channel and contains attachments
  if (
    message.channel.id === CHANNEL_ID &&
    (message.attachments.size > 0 || urlRegex.test(message.content))
  ) {
    const userId = message.author.id;

    // Check for cooldown
    if (cooldowns.has(userId)) {
      const lastMessageTime = cooldowns.get(userId);
      const now = Date.now();
      const timePassed = (now - lastMessageTime) / 1000;

      if (timePassed < COOLDOWN_SECONDS) {
        // User is on cooldown, ignore the message
        return;
      }
    }

    // Update the count for the user
    if (!mediaCounts[userId]) {
      mediaCounts[userId] = 0;
    }
    mediaCounts[userId] += 1;

    // Calculate the total number of posts
    const totalPosts = Object.values(mediaCounts).reduce(
      (sum, count) => sum + count,
      0
    );

    // Update the JSON file for media counts
    fs.writeFileSync(mediaCountsPath, JSON.stringify(mediaCounts, null, 2));

    // Set the new cooldown time and save it
    cooldowns.set(userId, Date.now());
    saveCooldowns();

    // Fetch the member object to check roles
    const member = await message.guild.members.fetch(userId);

    // Update roles based on media count
    await updateRoles(member, mediaCounts[userId]);

    // Combine relevant response arrays based on roles
    let combinedResponses = [...genderlessResponses];
    const hasMaleRole = member.roles.cache.has(MALE_ROLE_ID);
    const hasFemaleRole = member.roles.cache.has(FEMALE_ROLE_ID);
    const hasTransRole = member.roles.cache.has(TRANS_ROLE_ID);

    if (hasMaleRole && hasTransRole) {
      combinedResponses = [...combinedResponses, ...ftmResponses];
    } else if (hasFemaleRole && hasTransRole) {
      combinedResponses = [...combinedResponses, ...mtfResponses];
    }
    if (hasMaleRole) {
      combinedResponses = [...combinedResponses, ...maleResponses];
    }
    if (hasFemaleRole) {
      combinedResponses = [...combinedResponses, ...femaleResponses];
    }

    // Initialize weights if necessary
    initializeWeights();

    // Get a weighted random response from the combined array
    const responsePart1 = getWeightedRandomResponse(shuffle(combinedResponses));

    // Increase the weights of the non-selected responses
    combinedResponses.forEach((response) => {
      if (response !== responsePart1) {
        responseWeights[response] += 1;
      }
    });

    // Save the updated weights
    saveWeights();
    // Create the formatted string for the second part
    const userPostCount = mediaCounts[userId];
    const userPostSuffix = getOrdinalSuffix(userPostCount);
    const totalPostSuffix = getOrdinalSuffix(totalPosts);
    const responsePart2 = `# This was your **${userPostCount}${userPostSuffix}** load and the server's **${totalPosts}${totalPostSuffix}** orgasm~`;

    // Combine the parts into the full response
    const responseMessage = `${responsePart1}\n${responsePart2} :sweat_drops:`;

    // Send a reply to the user and add a 1-3 random rection emojis
    try {
      const randomNum = Math.floor(Math.random() * 3) + 1;
      for (var i = 0; i < randomNum; i++) {
        await message.react(
          REACTION_EMOJI_IDS[
            Math.floor(Math.random() * REACTION_EMOJI_IDS.length)
          ]
        );
      }
      await message.reply(responseMessage);
    } catch (error) {
      console.error("Failed to send reply:", error);
    }
  }
}

module.exports = { updateRoles, handleMediaMessage };
