const PassportReader = require("@gitcoinco/passport-sdk-reader");
const fs = require("fs");
const { parse } = require("csv-parse/sync");
const { stringify } = require("csv-stringify/sync");

const readPassport = async (address) => {
  const CERAMIC_PASSPORT = "https://ceramic.passport-iam.gitcoin.co";
  const reader = new PassportReader.PassportReader(CERAMIC_PASSPORT, "1");
  const passport = await reader.getPassport(address);
  return passport;
};

const readPassportSample = async () => {
  const CERAMIC_PASSPORT = "https://ceramic.passport-iam.gitcoin.co";
  const reader = new PassportReader.PassportReader(CERAMIC_PASSPORT, "1");

  const address = "0x13ef1086cdfecc00e0f8f3b2ac2c600f297dc333";

  const passport = await reader.getPassport(address);
  console.log(passport);
};

const filterValidStamps = (stamps) => {
  const currentTimestamp = Date.now();
  const lastDay = Date.parse("2023-01-03T00:00:00.000Z");

  const filteredStamps = [];
  for (let i = 0; i < stamps?.length; i++) {
    const stamp = stamps[i];
    if (
      // select the first stamp when a provider is stored multiple times (should be the most recent)
      !stamps.slice(i + 1).find((s) => s.provider === stamp.provider) &&
      // check if stamp is not expired yet
      Date.parse(stamp.credential.expirationDate) > currentTimestamp &&
      Date.parse(stamp.credential.issuanceDate) < lastDay
    ) {
      filteredStamps.push(stamp.provider);
    }
  }
  return filteredStamps;
};

const mainFunc = async () => {
  //   const inputData = fs.readFileSync("addresses.csv", { encoding: "utf8" });
  const inputData = fs.readFileSync("output.csv", { encoding: "utf8" });
  const parsedData = parse(inputData, { columns: true });

  //   console.log(parsedData[0]);
  for (record of parsedData) {
    console.log(record.index);

    if (record.index < 27400) continue;

    try {
      const passport = await readPassport(record.address);
      console.log(passport);
      const validStamps = filterValidStamps(passport.stamps);
      record.valid_stamps_count = validStamps?.length;
      if (validStamps?.length) {
        record.stamp_providers = validStamps;
        record.issuance_date = passport.issuanceDate;
      }

      const outputDataCsv = stringify(parsedData, { header: true });

      fs.writeFileSync("output.csv", outputDataCsv, { encoding: "utf8" });
    } catch (error) {
      console.error(error);
    }
  }
};

mainFunc();
// readPassportSample();
