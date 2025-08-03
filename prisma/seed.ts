import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Helper function to generate random data
const getRandomElement = (array: string[]) => array[Math.floor(Math.random() * array.length)];
const getRandomNumber = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomBoolean = () => Math.random() > 0.5;

// Sample data arrays
const catNames = [
  'Whiskers', 'Shadow', 'Luna', 'Mittens', 'Fluffy', 'Tiger', 'Smokey', 'Patches', 'Oreo', 'Ginger',
  'Bella', 'Charlie', 'Max', 'Lucy', 'Oliver', 'Lily', 'Milo', 'Chloe', 'Leo', 'Zoe',
  'Simba', 'Nala', 'Felix', 'Garfield', 'Sylvester', 'Tom', 'Mittens', 'Snowball', 'Blackie', 'Tabby',
  'Princess', 'Duchess', 'Lady', 'Queen', 'Angel', 'Star', 'Diamond', 'Pearl', 'Ruby', 'Sapphire',
  'Storm', 'Thunder', 'Lightning', 'Rain', 'Cloud', 'Sunny', 'Misty', 'Foggy', 'Breezy', 'Windy'
];

const dogNames = [
  'Buddy', 'Max', 'Charlie', 'Rocky', 'Cooper', 'Duke', 'Bear', 'Tucker', 'Jack', 'Toby',
  'Bella', 'Lucy', 'Daisy', 'Lola', 'Luna', 'Molly', 'Sophie', 'Sadie', 'Maggie', 'Chloe',
  'Rex', 'Zeus', 'Thor', 'Apollo', 'Atlas', 'Titan', 'Hercules', 'Ranger', 'Scout', 'Hunter',
  'Princess', 'Lady', 'Duchess', 'Queen', 'Angel', 'Star', 'Diamond', 'Pearl', 'Ruby', 'Sapphire',
  'Storm', 'Thunder', 'Lightning', 'Rain', 'Cloud', 'Sunny', 'Misty', 'Foggy', 'Breezy', 'Windy'
];

const catBreeds = [
  'Persian', 'Siamese', 'Maine Coon', 'British Shorthair', 'Ragdoll', 'Bengal', 'Abyssinian',
  'Russian Blue', 'Scottish Fold', 'Sphynx', 'American Shorthair', 'Oriental', 'Birman',
  'Manx', 'Devon Rex', 'Cornish Rex', 'Turkish Angora', 'Norwegian Forest', 'Exotic Shorthair',
  'Burmese', 'Tonkinese', 'Chartreux', 'Turkish Van', 'Somali', 'Ocicat', 'Domestic Shorthair',
  'Domestic Longhair', 'Mixed Breed', 'Unknown', 'Tabby'
];

const dogBreeds = [
  'Labrador Retriever', 'Golden Retriever', 'German Shepherd', 'Bulldog', 'Poodle', 'Beagle',
  'Rottweiler', 'German Shorthaired Pointer', 'Yorkshire Terrier', 'Dachshund', 'Siberian Husky',
  'Boxer', 'Great Dane', 'Pomeranian', 'Boston Terrier', 'Shih Tzu', 'Australian Shepherd',
  'Pembroke Welsh Corgi', 'Chihuahua', 'Border Collie', 'Cocker Spaniel', 'Mastiff', 'Pit Bull',
  'French Bulldog', 'Cavalier King Charles Spaniel', 'Maltese', 'Basset Hound', 'Mixed Breed',
  'Jack Russell Terrier', 'Akita', 'Dalmatian', 'Greyhound', 'Saint Bernard', 'Newfoundland'
];

const colours = [
  'Black', 'White', 'Brown', 'Gray', 'Orange', 'Cream', 'Tan', 'Blue', 'Silver', 'Gold',
  'Black and White', 'Brown and White', 'Gray and White', 'Orange and White', 'Cream and White',
  'Tabby', 'Calico', 'Tortoiseshell', 'Tuxedo', 'Tricolor', 'Brindle', 'Spotted', 'Merle'
];

const markings = [
  'None', 'White chest', 'White paws', 'White face', 'Black mask', 'White blaze', 'Spotted',
  'Striped', 'Solid color', 'Two-toned', 'Patches', 'Brindle pattern', 'White markings',
  'Dark markings', 'Facial markings', 'Leg markings', 'Tail markings', 'Ear markings'
];

const suburbs = [
  'Downtown', 'Riverside', 'Hillside', 'Parkview', 'Lakeside', 'Meadowbrook', 'Oakwood',
  'Sunset Hills', 'Pine Valley', 'Cedar Grove', 'Maple Heights', 'Birchwood', 'Elmwood',
  'Willowbrook', 'Rosewood', 'Fairview', 'Greenwood', 'Redwood', 'Ashwood', 'Beechwood',
  'Chestnut Hill', 'Dogwood', 'Hazelwood', 'Ironwood', 'Laurelwood', 'Magnolia', 'Poplar Grove',
  'Sycamore', 'Walnut Creek', 'Cherry Hill'
];

const streets = [
  'Main Street', 'Oak Avenue', 'Pine Street', 'Maple Drive', 'Cedar Lane', 'Elm Street',
  'Birch Road', 'Willow Way', 'Rose Boulevard', 'Sunset Drive', 'Park Avenue', 'Hill Street',
  'Valley Road', 'Creek Lane', 'Forest Drive', 'Garden Street', 'Lake Road', 'River Street',
  'Mountain View', 'Meadow Lane', 'Spring Street', 'Summer Avenue', 'Winter Drive', 'Autumn Way'
];

const firstNames = [
  'John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Jessica', 'William', 'Ashley',
  'James', 'Amanda', 'Richard', 'Stephanie', 'Joseph', 'Melissa', 'Thomas', 'Nicole', 'Mark', 'Lisa',
  'Daniel', 'Karen', 'Paul', 'Nancy', 'Steven', 'Betty', 'Kenneth', 'Helen', 'Joshua', 'Sandra'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson'
];

// Generate random tag number
const generateTagNumber = (prefix: string, index: number) => {
  const year = new Date().getFullYear();
  return `${prefix}${year}${String(index).padStart(6, '0')}`;
};

// Generate random microchip number
const generateMicrochipNumber = () => {
  return Array.from({length: 15}, () => Math.floor(Math.random() * 10)).join('');
};

// Generate random date within the last 2 years
const generateRandomDate = () => {
  const start = new Date();
  start.setFullYear(start.getFullYear() - 2);
  const end = new Date();
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Generate conviction ban dates (only for some animals)
const generateConvictionDates = () => {
  if (Math.random() > 0.95) { // Only 5% have conviction dates
    const startDate = generateRandomDate();
    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + getRandomNumber(1, 3));
    return { startDate, endDate };
  }
  return { startDate: null, endDate: null };
};

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clean existing data
  console.log('🧹 Cleaning existing animal data...');
  await prisma.dog.deleteMany({});
  await prisma.cat.deleteMany({});
  
  // Don't delete users if they already exist
  const existingUsers = await prisma.user.findMany({
    where: {
      email: {
        in: ['john.owner@example.com', 'jane.owner@example.com']
      }
    }
  });

  let user1, user2;

  if (existingUsers.length === 0) {
    console.log('👥 Creating users...');
    
    // Create two users
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    user1 = await prisma.user.create({
      data: {
        email: 'john.owner@example.com',
        password: hashedPassword,
        fullName: 'John Owner',
        phone: '+1234567890',
        status: 'active',
        isAdmin: false,
      },
    });

    user2 = await prisma.user.create({
      data: {
        email: 'jane.owner@example.com',
        password: hashedPassword,
        fullName: 'Jane Owner',
        phone: '+1234567891',
        status: 'active',
        isAdmin: false,
      },
    });
  } else {
    console.log('👥 Using existing users...');
    user1 = existingUsers.find(u => u.email === 'john.owner@example.com');
    user2 = existingUsers.find(u => u.email === 'jane.owner@example.com');
    
    if (!user1) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      user1 = await prisma.user.create({
        data: {
          email: 'john.owner@example.com',
          password: hashedPassword,
          fullName: 'John Owner',
          phone: '+1234567890',
          status: 'active',
          isAdmin: false,
        },
      });
    }
    
    if (!user2) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      user2 = await prisma.user.create({
        data: {
          email: 'jane.owner@example.com',
          password: hashedPassword,
          fullName: 'Jane Owner',
          phone: '+1234567891',
          status: 'active',
          isAdmin: false,
        },
      });
    }
  }

  console.log('🐱 Creating cats...');
  
  // Create 500 cats for user1 and 500 for user2
  const catPromises: Promise<any>[] = [];
  
  for (let i = 1; i <= 500; i++) {
    const convictionDates = generateConvictionDates();
    const catData = {
      tagNumber: generateTagNumber('CAT', i),
      na: getRandomElement(['Y', 'N']),
      lastName: getRandomElement(lastNames),
      givenName: getRandomElement(firstNames),
      addressNo: String(getRandomNumber(1, 999)),
      lotNo: String(getRandomNumber(1, 100)),
      houseNo: String(getRandomNumber(1, 200)),
      street: getRandomElement(streets),
      suburb: getRandomElement(suburbs),
      name: getRandomElement(catNames),
      breedCode: `CAT${String(getRandomNumber(1, 50)).padStart(3, '0')}`,
      breed: getRandomElement(catBreeds),
      colour: getRandomElement(colours),
      markings: getRandomElement(markings),
      sterilised: getRandomBoolean(),
      nextYearTagNo: generateTagNumber('CAT', i + 1000),
      oldTagNo: i > 1 ? generateTagNumber('CAT', i - 1000) : '',
      microchipNo: generateMicrochipNumber(),
      currentConvictionBannedStartDate: convictionDates.startDate,
      currentConvictionBannedEndDate: convictionDates.endDate,
      ownerId: user1.id,
    };
    
    catPromises.push(prisma.cat.create({ data: catData }));
  }

  for (let i = 501; i <= 1000; i++) {
    const convictionDates = generateConvictionDates();
    const catData = {
      tagNumber: generateTagNumber('CAT', i),
      na: getRandomElement(['Y', 'N']),
      lastName: getRandomElement(lastNames),
      givenName: getRandomElement(firstNames),
      addressNo: String(getRandomNumber(1, 999)),
      lotNo: String(getRandomNumber(1, 100)),
      houseNo: String(getRandomNumber(1, 200)),
      street: getRandomElement(streets),
      suburb: getRandomElement(suburbs),
      name: getRandomElement(catNames),
      breedCode: `CAT${String(getRandomNumber(1, 50)).padStart(3, '0')}`,
      breed: getRandomElement(catBreeds),
      colour: getRandomElement(colours),
      markings: getRandomElement(markings),
      sterilised: getRandomBoolean(),
      nextYearTagNo: generateTagNumber('CAT', i + 1000),
      oldTagNo: generateTagNumber('CAT', i - 1000),
      microchipNo: generateMicrochipNumber(),
      currentConvictionBannedStartDate: convictionDates.startDate,
      currentConvictionBannedEndDate: convictionDates.endDate,
      ownerId: user2.id,
    };
    
    catPromises.push(prisma.cat.create({ data: catData }));
  }

  // Execute cat creation in batches
  const batchSize = 50;
  for (let i = 0; i < catPromises.length; i += batchSize) {
    const batch = catPromises.slice(i, i + batchSize);
    await Promise.all(batch);
    console.log(`🐱 Created ${Math.min(i + batchSize, catPromises.length)} cats...`);
  }

  console.log('🐕 Creating dogs...');
  
  // Create 500 dogs for user1 and 500 for user2
  const dogPromises: Promise<any>[] = [];
  
  for (let i = 1; i <= 500; i++) {
    const convictionDates = generateConvictionDates();
    const dogData = {
      tagNumber: generateTagNumber('DOG', i),
      na: getRandomElement(['Y', 'N']),
      lastName: getRandomElement(lastNames),
      givenName: getRandomElement(firstNames),
      addressNo: String(getRandomNumber(1, 999)),
      lotNo: String(getRandomNumber(1, 100)),
      houseNo: String(getRandomNumber(1, 200)),
      street: getRandomElement(streets),
      suburb: getRandomElement(suburbs),
      name: getRandomElement(dogNames),
      breedCode: `DOG${String(getRandomNumber(1, 50)).padStart(3, '0')}`,
      breed: getRandomElement(dogBreeds),
      colour: getRandomElement(colours),
      markings: getRandomElement(markings),
      sterilised: getRandomBoolean(),
      nextYearTagNo: generateTagNumber('DOG', i + 1000),
      oldTagNo: i > 1 ? generateTagNumber('DOG', i - 1000) : '',
      microchipNo: generateMicrochipNumber(),
      currentConvictionBannedStartDate: convictionDates.startDate,
      currentConvictionBannedEndDate: convictionDates.endDate,
      dangerous: getRandomBoolean() && Math.random() > 0.9, // Only 10% are dangerous
      animalBreeder: getRandomBoolean() && Math.random() > 0.8, // Only 20% are breeders
      ownerId: user1.id,
    };
    
    dogPromises.push(prisma.dog.create({ data: dogData }));
  }

  for (let i = 501; i <= 1000; i++) {
    const convictionDates = generateConvictionDates();
    const dogData = {
      tagNumber: generateTagNumber('DOG', i),
      na: getRandomElement(['Y', 'N']),
      lastName: getRandomElement(lastNames),
      givenName: getRandomElement(firstNames),
      addressNo: String(getRandomNumber(1, 999)),
      lotNo: String(getRandomNumber(1, 100)),
      houseNo: String(getRandomNumber(1, 200)),
      street: getRandomElement(streets),
      suburb: getRandomElement(suburbs),
      name: getRandomElement(dogNames),
      breedCode: `DOG${String(getRandomNumber(1, 50)).padStart(3, '0')}`,
      breed: getRandomElement(dogBreeds),
      colour: getRandomElement(colours),
      markings: getRandomElement(markings),
      sterilised: getRandomBoolean(),
      nextYearTagNo: generateTagNumber('DOG', i + 1000),
      oldTagNo: generateTagNumber('DOG', i - 1000),
      microchipNo: generateMicrochipNumber(),
      currentConvictionBannedStartDate: convictionDates.startDate,
      currentConvictionBannedEndDate: convictionDates.endDate,
      dangerous: getRandomBoolean() && Math.random() > 0.9, // Only 10% are dangerous
      animalBreeder: getRandomBoolean() && Math.random() > 0.8, // Only 20% are breeders
      ownerId: user2.id,
    };
    
    dogPromises.push(prisma.dog.create({ data: dogData }));
  }

  // Execute dog creation in batches
  for (let i = 0; i < dogPromises.length; i += batchSize) {
    const batch = dogPromises.slice(i, i + batchSize);
    await Promise.all(batch);
    console.log(`🐕 Created ${Math.min(i + batchSize, dogPromises.length)} dogs...`);
  }

  console.log('✅ Seeding completed successfully!');
  console.log('📊 Summary:');
  console.log(`👥 Users created: 2`);
  console.log(`🐱 Cats created: 1000 (500 for each user)`);
  console.log(`🐕 Dogs created: 1000 (500 for each user)`);
  console.log('');
  console.log('🔑 Test users:');
  console.log(`📧 User 1: john.owner@example.com (password: password123)`);
  console.log(`📧 User 2: jane.owner@example.com (password: password123)`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
