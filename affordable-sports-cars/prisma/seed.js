// prisma/seed.js (CommonJS for Windows friendliness)
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const cars = [
    { make:"Porsche", model:"718 Cayman", year:2021, priceUSD:76900, horsepower:300, zeroTo60:4.9, imageUrl:"https://images.unsplash.com/photo-1503376780353-7e6692767b70" },
    { make:"Chevrolet", model:"Corvette C8", year:2022, priceUSD:69995, horsepower:495, zeroTo60:2.9, imageUrl:"https://images.unsplash.com/photo-1525609004556-c46c7d6cf023" },
    { make:"Toyota", model:"GR Supra", year:2021, priceUSD:54990, horsepower:382, zeroTo60:3.9, imageUrl:"https://images.unsplash.com/photo-1525609004556-c46c7d6cf023" },
    { make:"BMW", model:"M2", year:2023, priceUSD:62900, horsepower:453, zeroTo60:3.9, imageUrl:"https://images.unsplash.com/photo-1549924231-f129b911e442" },
    { make:"Audi", model:"RS3", year:2022, priceUSD:60900, horsepower:401, zeroTo60:3.6, imageUrl:"https://images.unsplash.com/photo-1549924231-f129b911e442" },
    { make:"Nissan", model:"Z", year:2023, priceUSD:42995, horsepower:400, zeroTo60:4.3, imageUrl:"https://images.unsplash.com/photo-1517677208171-0bc6725a3e60" },
    { make:"Ford", model:"Mustang GT", year:2021, priceUSD:38990, horsepower:450, zeroTo60:4.2, imageUrl:"https://images.unsplash.com/photo-1483721310020-03333e577078" },
    { make:"Jaguar", model:"F-Type", year:2020, priceUSD:78900, horsepower:444, zeroTo60:4.4, imageUrl:"https://images.unsplash.com/photo-1542362567-b07e54358753" },
    { make:"Porsche", model:"911 Carrera (997)", year:2008, priceUSD:89900, horsepower:345, zeroTo60:4.7, imageUrl:"https://images.unsplash.com/photo-1511910849309-0dffb8785146" },
    { make:"Audi", model:"TTS", year:2020, priceUSD:55900, horsepower:288, zeroTo60:4.4, imageUrl:"https://images.unsplash.com/photo-1533473359331-0135ef1b58bf" },
    { make:"BMW", model:"M4 (F82)", year:2018, priceUSD:57900, horsepower:425, zeroTo60:4.1, imageUrl:"https://images.unsplash.com/photo-1511396275276-5a93613be8c3" },
    { make:"Porsche", model:"Cayman (981)", year:2014, priceUSD:48900, horsepower:275, zeroTo60:5.4, imageUrl:"https://images.unsplash.com/photo-1511910849309-0dffb8785146" }
  ];

  // relies on @@unique([make, model, year]); duplicates will be skipped
  await prisma.car.createMany({ data: cars, skipDuplicates: true });
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
