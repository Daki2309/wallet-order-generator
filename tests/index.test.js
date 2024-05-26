const orderGenerator = require('../index.js');

test('from: get json', () => {
    let result = orderGenerator.from('./tests/source/');

    expect(result).not.toBeNull();
    expect(result).not.toBeUndefined();
});

test('getListOfPngFiles: filter out json file', () => {
    let result = orderGenerator.getListOfPngFiles('./tests/source/');

    expect(result.length).toEqual(4);
    expect(result.includes('bakery_logo.png')).toBeTruthy();
    expect(result.includes('cheesecake.png')).toBeTruthy();
    expect(result.includes('pastry.png')).toBeTruthy();
    expect(result.includes('spongecake.png')).toBeTruthy();
    expect(result.includes('order.json')).toBeFalsy();
});