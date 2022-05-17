const request = require("request");
const fs = require('fs');
const { stringify } = require("csv-stringify");

const key = "d0c6a9ae98ef39ac2ecc8bc7d040d205"
const journalid = "11443"
const host = "http://api.springernature.com"
const page = 100
const StartURL = `${host}/meta/v2/json?q=journalid:${journalid}&p=${page}&api_key=${key}`;

const publisher ='Pleiades Publishing Inc'
const journal = 'ASTRONOMY LETTERS'

const dirPath = __dirname+`/output/${publisher}/${journal}/`
const outArticlesCsv = dirPath+`articles.csv`
const outVolumesCsv = dirPath+`volumes.csv`

articles = []
volumes = []
count = 0

function getAPI (url) {
    return new Promise((resolve, reject) => {
        json = null        
        request.get(url, async(error, response, body) => {
            json = JSON.parse(body);

            if (json && json['result']) {

                const recordCnt = json['result']['recordsDisplayed']
                const records = json['records']                
        
                records.forEach(record => {
        
                    var date = new Date(record['publicationDate'])
                    var n = date.getYear()
                    var year = parseInt(n)

                    if (year > 115) { // From 2016

                        const mYear1 = year + 1900
                        const mYear = mYear1.toString()
                        const mVolume = 'Volume ' + record['volume']
                        const mIssue = 'Issue ' + record['number']
                        const mTitle = record['title']
                        const mDoi = record['doi']
                        const mPublicationDate = record['publicationDate']
                        var mSection = ''
                        if(Array.isArray(record['genre'])) {
                            record['genre'].forEach((item, index) => {
                            
                                if (index === 0) {
                                    mSection = item
                                } else {
                                    mSection = mSection + ', ' + item
                                }
                            })
                        } else {
                            mSection = record['genre']
                        }
                        
                        var mCreators = ''
                        if (Array.isArray(record['creators'])) {
                            record['creators'].forEach((man, index) => {                        
                            
                                if (index === 0) {
                                    mCreators = man['creator']
                                } else {
                                    mCreators = mCreators + ', ' + man['creator']
                                }
                            })
                        } else {
                            mCreators = record['creators']
                        }
                        

                        count++
                        const article = {
                            'No': count,
                            'Publisher': publisher,
                            'Journal': journal,
                            'Year': mYear,
                            'Volume': mVolume,
                            'Issue': mIssue,
                            'Pub YM': mPublicationDate,
                            'Section': mSection,
                            'Article Title': mTitle,
                            'Author(s)': mCreators,
                            'Literature': '',
                            'DOI': mDoi,
                            'PdfURL': '',
                            'Download': ''
                        }

                        
                        articles = [...articles, article]

                        //Make Volumes
                        if(1) {
                            var isNew = true                        

                            for (let index = 0; index < volumes.length; index++) {
                                const item = volumes[index];

                                if (item['Year']===mYear && item['Volume']===mVolume && item['Issue']===mIssue) {
                                    isNew = false
                                    break
                                }                            
                            }

                            if (isNew) {
                                const volume = {
                                    'No': '',
                                    'Publisher': publisher,
                                    'Journal': journal,
                                    'Year': mYear,
                                    'Volume': mVolume,
                                    'Issue': mIssue,
                                    'FrontMatter': '',
                                    'BackMatter': '',
                                    'TOC': '',
                                    'FM_Down': '',
                                    'BM_Down': '',
                                    'TOC_Down': '',
                                    'TotalCount': '',
                                    'DownCount': ''                                
                                }
                                volumes = [...volumes, volume]                            
                            }
                        }                    
                    } else {
                        //console.log("Old than 2016")
                    }
                    
                    
                });

                if (json['nextPage']) {
                    nextUrl = json['nextPage']
                    console.log(nextUrl, articles.length)
                    
                    const a = await main(host+nextUrl)

                } else {
                    resolve({articles, volumes});
                }
                
            } else {
                resolve({articles, volumes});
            }
        });
    });
}

async function main(url = StartURL) {
    const result = await getAPI(url)

    data = result['articles']

    if (!fs.existsSync(dirPath)){
        fs.mkdirSync(dirPath, { recursive: true });
    }

    stringify(data, { header: true }, (err, output) => {
        if (err) throw err;
        fs.writeFile(outArticlesCsv, output, (err) => {
          if (err) throw err;
          console.log(outArticlesCsv+' saved.');
        });
      });
    
    volumes = result['volumes']    

    stringify(volumes, { header: true }, (err, output) => {
        if (err) throw err;
        fs.writeFile(outVolumesCsv, output, (err) => {
          if (err) throw err;
          console.log(outVolumesCsv+' saved.');
        });
      });
    
}



main()



