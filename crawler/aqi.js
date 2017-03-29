"use strict"

// 导入基本库
const request = require('request')
const cheerio = require('cheerio')
const fs = require('fs')

const log = function() {
    console.log.apply(console, arguments)
}

// 雾霾数据类
const Data = function() {
    this.name = ''
    this.value = 0
}

// 把保存了所有雾霾对象的数组保存到文件中
const saveJSON = function(path, data) {
    const s = JSON.stringify(data, null, 4)
    fs.writeFile(path, s, function(error){
        if (error !== null) {
            log('--- 写入文件错误', error)
        } else {
            log('--- 保存成功')
        }
    })
}

const dataFromJSON = function(data, json) {
    var airObjects = JSON.parse(json)
    for (var i = 0; i < airObjects.length; i++) {
        var airObject = airObjects[i]
        var object = new Data()

        object.name = airObject.CITY.split('市')[0]
        object.value = parseInt(airObject.AQI)
        data.push(object)
    }
}

const jsonFromBody = function(body) {
    var options = {
        decodeEntities: false
    }
    const e = cheerio.load(body, options)
    var json = e('#gisDataJson').attr('value')
    return json
}

const writeToFile = function(path, data) {
    fs.writeFile(path, data, function(error) {
        if (error !== null) {
            log('--- 写入失败: ', path)
        } else {
            log('--- 写入成功: ', path)
        }
    })
}

// 清除缓存文件
const removeData = function(i) {
    var fs = require("fs")
    log("--- 准备删除文件")
    var path = 'http---datacenter.mep.gov.cn-8099-ths-report-report!list.action-' + i + '.html'
    fs.unlink(path, function(err) {
        if (err) {
            return console.error(err)
        }
        log("--- 文件删除成功")
    })
}

const cachedUrl = function(pageNum, callback) {
    var formData = {
          'page.pageNo': `${pageNum}`,
          'xmlname': '1462259560614'
    }

    var postData = {
        url: 'http://datacenter.mep.gov.cn:8099/ths-report/report!list.action',
        formData: formData
    }

    const path = postData.url.split('/').join('-').split(':').join('-') + '-' + `${pageNum}` + '.html'

    fs.readFile(path, function(err, data) {
        // 判断状态
        if (err !== null) {
            // 缓存页面并爬取数据
            request.post(postData, function(error, response, body){
                if (error === null) {
                    // 写入内容
                    writeToFile(path, body)
                    callback(error, response, body)
                }
            })
        } else {
            // 若执行时已有缓存, 则清除之
            for (var i = 1; i < 14; i++) {
                removeData(i)
            }
        }
    })
}

const __main = function() {
    var data = []
    var path = 'aqi.json'
    log('主函数执行')
    for (var i = 1; i < 14; i++) {
        cachedUrl(i, function(error, response, body){
            if (error === null && response.statusCode === 200) {
                // log('读取成功')
                const json = jsonFromBody(body)
                dataFromJSON(data, json)
                saveJSON(path, data)
            } else {
                log('--- 请求失败', error)
            }
        })
    }
    var time = new Date()
}

__main()
