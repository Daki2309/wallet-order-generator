const orderGenerator = require('../index.js');
const signerCreator = require('../signatureCreator.js');

test('from: get json', () => {
    let result = orderGenerator.from('./tests/source');

    expect(result).not.toBeNull();
    expect(result).not.toBeUndefined();
});

test('getListOfPngFiles: filter out json file', () => {
    let result = orderGenerator.getListOfPngFiles('./tests/source');

    expect(result.length).toEqual(4);
    expect(result.includes('bakery_logo.png')).toBeTruthy();
    expect(result.includes('cheesecake.png')).toBeTruthy();
    expect(result.includes('pastry.png')).toBeTruthy();
    expect(result.includes('spongecake.png')).toBeTruthy();
    expect(result.includes('order.json')).toBeFalsy();
});

test('generateOrder fail: use default folder path ./model.order for template folder', async () => {
    let orderInstance = orderGenerator.from('./tests/source');
    try {
        await orderGenerator.generateOrder(orderInstance, "123456789")
    } catch (e) {
        expect(e.code).toEqual('ENOENT');
        expect(e.path).toEqual('./model.order/');
    }
});

test('generateOrder: use specified folder path ./tests/source for template folder', async () => {
    const mock = jest.spyOn(signerCreator, 'getSignature');
    mock.mockImplementation(() => true);

    let orderInstance = orderGenerator.from('./tests/source');

    await orderGenerator.generateOrder(orderInstance, "123456789", undefined, './tests/source')

    expect(mock).toHaveBeenCalledWith({
            "bakery_logo.png": "80fac49e058e813ebfd974e5dd77002fb7ddcb1b931e64fc014c7b3f2227bb2e",
            "cheesecake.png": "468339dbe7f0674416f90dd94f62d2015595d71ec95eff6232cb34d7d2f91d6b",
            "order.json": "0dfaab96a1f1d1e75743e77f5f2e848942b0d97c562e46b55fc811b3c7f14743",
            "pastry.png": "0865ac234f5c779e99e652b19a65b2b898b42475b91ffaf24c6a2767767c2fd1",
            "spongecake.png": "3d4e67f90f7a669cfbc58ddf7dfcb13150ee85773901b1103a3896b2e5354fd5"
        },
        '123456789',
        './certs')
});

test('generateOrder: use default includePngFileNames to import all available png files', async () => {
    const mock = jest.spyOn(signerCreator, 'getSignature');
    mock.mockImplementation(() => true);

    const getListOfPngFilesMock = jest.spyOn(orderGenerator, 'getListOfPngFiles');

    let orderInstance = orderGenerator.from('./tests/source');

    await orderGenerator.generateOrder(orderInstance, "123456789", undefined, './tests/source')

    expect(getListOfPngFilesMock).toHaveBeenCalled();
});

test('generateOrder: use given includePngFileNames to import only given png file name', async () => {
    const mock = jest.spyOn(signerCreator, 'getSignature');
    mock.mockImplementation(() => true);

    const getListOfPngFilesMock = jest.spyOn(orderGenerator, 'getListOfPngFiles');

    let orderInstance = orderGenerator.from('./tests/source');

    await orderGenerator.generateOrder(orderInstance, "123456789", ['pastry.png'], './tests/source')

    expect(getListOfPngFilesMock).not.toHaveBeenCalled();

    expect(mock).toHaveBeenCalledWith({
            "order.json": "0dfaab96a1f1d1e75743e77f5f2e848942b0d97c562e46b55fc811b3c7f14743",
            "pastry.png": "0865ac234f5c779e99e652b19a65b2b898b42475b91ffaf24c6a2767767c2fd1"
        },
        '123456789',
        './certs')
});

test('generateOrder fail: use default folder path ./certs for certs folder', async () => {
    const mock = jest.spyOn(signerCreator, 'getSignature');
    mock.mockImplementation(() => {
        const error = new Error("no such file or directory");
        error.path = './certs/signerCert.pem';
        error.code = "ENOENT";
        throw error;
    });

    let orderInstance = orderGenerator.from('./tests/source');

    try {
        await orderGenerator.generateOrder(orderInstance, "123456789", undefined, './tests/source')
    } catch (e) {
        expect(e.code).toEqual('ENOENT');
        expect(e.path).toEqual('./certs/signerCert.pem');
    }

    expect(mock).toHaveBeenCalledWith({
        "bakery_logo.png": "80fac49e058e813ebfd974e5dd77002fb7ddcb1b931e64fc014c7b3f2227bb2e",
        "cheesecake.png": "468339dbe7f0674416f90dd94f62d2015595d71ec95eff6232cb34d7d2f91d6b",
        "order.json": "0dfaab96a1f1d1e75743e77f5f2e848942b0d97c562e46b55fc811b3c7f14743",
        "pastry.png": "0865ac234f5c779e99e652b19a65b2b898b42475b91ffaf24c6a2767767c2fd1",
        "spongecake.png": "3d4e67f90f7a669cfbc58ddf7dfcb13150ee85773901b1103a3896b2e5354fd5"
        },
        '123456789',
        './certs')
});

test('generateOrder fail: use specified folder path ./tests/source for certs folder', async () => {
    const mock = jest.spyOn(signerCreator, 'getSignature');
    mock.mockImplementation(() => true);

    let orderInstance = orderGenerator.from('./tests/source');

    await orderGenerator.generateOrder(orderInstance, "123456789", undefined, './tests/source', './tests/source')

    expect(mock).toHaveBeenCalledWith({
            "bakery_logo.png": "80fac49e058e813ebfd974e5dd77002fb7ddcb1b931e64fc014c7b3f2227bb2e",
            "cheesecake.png": "468339dbe7f0674416f90dd94f62d2015595d71ec95eff6232cb34d7d2f91d6b",
            "order.json": "0dfaab96a1f1d1e75743e77f5f2e848942b0d97c562e46b55fc811b3c7f14743",
            "pastry.png": "0865ac234f5c779e99e652b19a65b2b898b42475b91ffaf24c6a2767767c2fd1",
            "spongecake.png": "3d4e67f90f7a669cfbc58ddf7dfcb13150ee85773901b1103a3896b2e5354fd5"
        },
        '123456789',
        './tests/source')
});