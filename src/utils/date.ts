export const getDateStringInEtTz = () =>
    new Date().toLocaleDateString('en-CA', {timeZone: 'America/New_York'})