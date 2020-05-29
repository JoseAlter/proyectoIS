const process = function(info) {
    let data = JSON.stringify(info);
    let ndata = JSON.parse(data)

    console.info('Data sucia: ', ndata);

    for (element in ndata) {
        var key = element;
        var value = ndata[element];
        // console.log(`${key} ${value}`);
        if (typeof value !== 'string' || value === '') {
            if (typeof value !== 'number') {
                if (typeof value !== 'boolean') {
                    delete ndata[key];
                }
            }
        }
    }

    return ndata;
}

module.exports = process;