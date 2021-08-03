const axios = require("axios")
const cheerio = require("cheerio")
const fs = require('fs')

const BASE_URL = "https://topflix.one"
var movies = []

const slug = (str) => {
    str = str.replace(/^\s+|\s+$/g, ''); // trim
    str = str.toLowerCase();
  
    // remove accents, swap ñ for n, etc
    var from = "àáäâèéëêìíïîòóöôùúüûñç·/_,:;";
    var to   = "aaaaeeeeiiiioooouuuunc------";
    for (var i=0, l=from.length ; i<l ; i++) {
        str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
    }

    str = str.replace(/[^a-z0-9 -]/g, '') // remove invalid chars
        .replace(/\s+/g, '-') // collapse whitespace and replace by -
        .replace(/-+/g, '-'); // collapse dashes

    return str;
}

const writeToFile = (data, path) => {
    const promiseCallBack = (resolve, reject) => {
        fs.writeFile(path, data, (error) => {
            if (error){
                reject(error)
                return
            } 
            resolve(true)
        })
    }
    return new Promise(promiseCallBack)
}

const readFromFile = (filename) => {
    const promiseCallBack = async (resolve) => {
        fs.readFile(filename, 'utf8', (error, contents) => {
            if(error){
                resolve(null)
                return 
            }
            resolve(contents)
        })
        
    }
    return new Promise(promiseCallBack)
}


const getPage = (path) => {
    
    const url = `${BASE_URL}${path}`

    return axios.get(url).then((response) => response.data)
}

const getCachedPage = (path) => {

    const filename = `cache/${slug(path)}.html` 

    const promiseCallBack = async (resolve, reject) => {


        const cachedHTML = await readFromFile(filename)

        if(!cachedHTML){
            const html = await getPage(path)
            await writeToFile(html, filename)
            resolve(html)
            return
        }
        resolve(cachedHTML)
        
    }
    
    return new Promise(promiseCallBack)
}


const getPageItems = (html) => {

    const $ = cheerio.load(html)
    
    const promiseCallBack = (resolve, reject) => {
        const selector = "body > div.page-single > div > div > div > div.flex-wrap-movielist.mv-grid-fw > div"  

        const selectorImg = "body > div.page-single > div > div > div > div.flex-wrap-movielist.mv-grid-fw > div:nth-child(1) > div.mv-img3 > a > img"

        
        $(selector).each(function (i, element) {
            const a = $(`div.mv-item-infor > h6 > a `, element)
            const src = $(`div.mv-img3 > a > img`, element)

            const title = a.text()

            let href = a.attr("href")
            href = BASE_URL+href

            const img = src.attr("src")

            movies.push({title, href, img})
        })


        
        resolve(movies)

    }

    return new Promise(promiseCallBack)
}


const saveData = (data, path) => {
    
    const promiseCallBack = async (resolve, reject) => {
        if(!data || data.length === 0) return resolve(true)
        const dataToStore = JSON.stringify({data: data}, null, 2)
        const created = await writeToFile(dataToStore, path)
        resolve(true)
    }



    return new Promise(promiseCallBack)

}

const getAllPages = async (start, finish) => {     
    for (let page = start; page < finish; page++){
        const path = `/list/filmes/${page}`
        await getCachedPage(path)
            .then(getPageItems)
            .then((data) => saveData(data, `./movies/db-${page}.json`))  
            .then()
    }  
    return movies 

}

getAllPages(1, 66)











































    