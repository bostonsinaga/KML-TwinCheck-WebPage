/*
    ditulis oleh boston sinaga (feb - mar 2022)
    email: bostonsinga@gmail.com
*/

alert('REPAIR DATA BEFORE USE!');

const USE_PROGRESS_LOG = true;
const PATH_EVALUATE_COUNTS = 6;
const COPY_POOL = document.querySelector('.copy-pool');

const XML = {
    TEXT: undefined,
    PLACEMARK: undefined,
    PATH: [],
    PIN: []
};
const progressPath = [], progressPin = [];

function tulisJarak(lat, lon) {

    /*
    * The math module contains a function
    * named toRadians which converts from
    * degrees to radians.
    */
    
    lon[0] *= Math.PI / 180;
    lon[1] *= Math.PI / 180;
    lat[0] *= Math.PI / 180;
    lat[1] *= Math.PI / 180;

    // Haversine formula
    let dlon = lon[1] - lon[0];
    let dlat = lat[1] - lat[0];
    let a = Math.pow(Math.sin(dlat / 2), 2)
            + Math.cos(lat[0]) * Math.cos(lat[1])
            * Math.pow(Math.sin(dlon / 2), 2);
        
    let c = 2 * Math.asin(Math.sqrt(a));

    // Radius of earth in kilometers. Use 3956
    // for miles
    let r = 6371;

    // calculate the result
    return(c * r);
}

function getCoordinates() {

    const arr = [];
    let isPath;
    
    function parseCoordinate(dom) {

        // koordinat
        let coor_str;
        if (dom.querySelector('LineString')) {
            isPath = true;
            coor_str = dom.querySelector('LineString coordinates').innerHTML;
        }
        else {
            isPath = false;
            coor_str = dom.querySelector('Point coordinates').innerHTML;
        }

        // jenis simbol
        let jenis_str;
        if (dom.querySelector('styleUrl')) {
            jenis_str = dom.querySelector('styleUrl').innerHTML.slice(5);
        }
        else {
            jenis_str = isPath ? 'akses' : 'closure';
        }
    
        let kors = {lat: [], lon: []};
        let val = '', buff = [], commaSetCount = 0;
        
        for (let e of coor_str) {
            if (e == ',') {
                buff.push(parseFloat(val));
                val = '';
                commaSetCount++;
            }
            else if (e != ' ' && commaSetCount < 2) {
                val += e;
            }
            else if (e == ' ' && commaSetCount >= 2) {
                commaSetCount = 0;
            }
        }

        let buffbuff = 0;

        // only available in south east asia
        // WARNING !!! this is so specific solve of
        // identification 'latitude and longitude'
        buff.forEach((e, i) => {
            if (i < buff.length) {
                if (e < buffbuff) kors.lat.push(e);
                else kors.lon.push(e);
                buffbuff = e;
            }
        });

        let jarak = 0;
        if (isPath) {
            for (let i = 0; i < kors.lat.length - 1; i++) {
                jarak += tulisJarak(
                    [kors.lat[i], kors.lat[i+1]],
                    [kors.lon[i], kors.lon[i+1]]
                );
            }
        }
        
        return (isPath ? 
            [
                kors.lat[0], 
                kors.lon[0],
                kors.lat[kors.lat.length - 1], 
                kors.lon[kors.lon.length - 1],
                jarak,
                jenis_str
            ]:
            [kors.lat[0], kors.lon[0], jenis_str]
        );
    }

    XML.PLACEMARK.forEach((el, ct) => {
        if (!el.querySelector('Polygon')) arr.push(parseCoordinate(el));
    });

    return arr;
}

function process() {

    const xmlParser = new DOMParser();
    const xmlDoc = xmlParser.parseFromString(XML.TEXT, 'text/xml');
    XML.PLACEMARK = xmlDoc.querySelectorAll('Document Placemark');
    
    let countDeterminer = 0, checkingCounter = [0, 0];

    function CHECKING_TWIN(coors) {
        const maxDeterminer = coors[0][0].length;
        let removedPool = Array.from({length: coors.length}, () => false);

        for (let ctr_current = coors.length - 1; ctr_current > 0; ctr_current--) { // from back

            for (let ctr_exist = 0; ctr_exist < coors.length; ctr_exist++) { // from front
                let isOver = false;

                if (ctr_current != ctr_exist) {
                    for (let i = 0; i < maxDeterminer; i++) {
                        if (!removedPool[ctr_exist] &&
                            coors[ctr_current][0][i] == coors[ctr_exist][0][i]
                        ) {

                            ///////////////////
                            if (countDeterminer >= maxDeterminer - 1) { // DETECTED TWIN HERE

                                const progress = () => '\n' + [coors[ctr_exist][0], '\n+++', '\n' + coors[ctr_current][0], '\n>>>'];

                                XML.PLACEMARK[coors[ctr_current][1]].remove();

                                if (USE_PROGRESS_LOG) {
                                    if (maxDeterminer == PATH_EVALUATE_COUNTS) { // PATH
                                        progressPath.push(progress());
                                        checkingCounter[0]++;
                                    }
                                    else { // PIN
                                        progressPin.push(progress());
                                        checkingCounter[1]++;
                                    }
                                }

                                removedPool[ctr_current] = true;
                                isOver = true;
                            }
                            ///////////////////

                            countDeterminer++;
                        }
                    }
                }

                countDeterminer = 0;
                if (isOver) break;
            }
        }
    }

    getCoordinates().forEach((el, ct) => {
        if (el.length >= PATH_EVALUATE_COUNTS) {
            XML.PATH.push([el, ct]);
        }
        else {
            XML.PIN.push([el, ct]);
        }
    });

    if (XML.PATH[0]) CHECKING_TWIN(XML.PATH); // PATH
    if (XML.PIN[0]) CHECKING_TWIN(XML.PIN); // PIN

    const xmlString = new XMLSerializer().serializeToString(xmlDoc);
    COPY_POOL.innerText = xmlString;

    if (USE_PROGRESS_LOG) {
        console.log(`PATH:\n${progressPath}\n\nPIN:\n${progressPin}`);
        console.log(`^^^\nTOTAL:\n-PATH: ${checkingCounter[0]}\n-PIN: ${checkingCounter[1]}`);
    }
}

function olahData() {

    const [file] = document.querySelector('input[type=file]').files;
    const reader = new FileReader();

    reader.addEventListener("load", () => {
        XML.TEXT = reader.result;
        process();

        const copyAll = (obj) => {
            var range = document.createRange();
            range.selectNode(obj);
            window.getSelection().removeAllRanges();
            window.getSelection().addRange(range);
        }

        COPY_POOL.addEventListener('click', () => copyAll(COPY_POOL));
        
    }, false);

    if (file) {
        reader.readAsText(file);
    }
}
