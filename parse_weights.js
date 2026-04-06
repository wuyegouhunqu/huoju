// 解析权重-S12.txt并转换为quanzhong.JSON格式
// 运行：node parse_weights.js

const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, '权重-S12.txt');
const outputFile = path.join(__dirname, 'quanzhong_new.JSON');

try {
    const content = fs.readFileSync(inputFile, 'utf8');
    const lines = content.split('\n').map(line => line.trim()).filter(line => line);
    
    let result = [];
    let currentEquipment = null;
    let currentAffixList = [];
    
    // 装备类型映射
    const equipmentTypes = [
        '戒指', '项链', '腰带',
        '火炮', '弓', '火枪', '弩',
        '武杖', '锡杖', '双手斧', '双手锤', '双手剑',
        '手枪', '手杖', '魔杖', '灵杖', '法杖',
        '单手斧', '单手锤', '单手剑', '匕首', '爪'
    ];
    
    // 部位判断
    const getPosition = (type) => {
        if (['戒指', '项链', '腰带'].includes(type)) return '饰品';
        return '武器';
    };
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // 检查是否是装备类型标题（格式："装备类型：" 或 "装备类型" 开头）
        const equipmentMatch = line.match(/^(.+)[:：]$/) || 
                             (equipmentTypes.includes(line) && [line]);
        
        if (equipmentMatch) {
            // 如果之前有装备数据，保存
            if (currentEquipment && currentAffixList.length > 0) {
                result.push({
                    "装备类型": currentEquipment,
                    "部位": getPosition(currentEquipment),
                    "词缀列表": currentAffixList
                });
            }
            
            // 开始新装备
            currentEquipment = equipmentMatch[1] || equipmentMatch[0];
            currentAffixList = [];
            continue;
        }
        
        // 检查是否是注释行或特殊行（比如"饰品部位包括..."）
        if (line.includes('包括') || line.includes('解梦消耗') || line.includes('计算规则')) {
            continue;
        }
        
        // 检查是否是表头（"词缀"、"Level"、"权重"等）
        if (line.includes('词缀') && line.includes('权重') || 
            line.includes('Level') && line.includes('Weight')) {
            continue;
        }
        
        // 解析词缀和权重
        // 格式：词缀内容\t权重 或 词缀内容 权重
        const parts = line.split(/\t|\s{2,}/); // 用制表符或多个空格分割
        
        if (parts.length >= 2) {
            let affixText = parts[0];
            let weightText = parts[parts.length - 1];
            
            // 尝试将最后一部分解析为数字
            let weight = parseInt(weightText);
            
            if (!isNaN(weight) && weight >= 0) {
                // 是有效权重
                currentAffixList.push({
                    "词缀": affixText,
                    "权重": weight
                });
            } else {
                // 如果最后一部分不是数字，尝试其他方式
                // 尝试查找行中的数字
                const weightMatch = line.match(/(\d+)$/);
                if (weightMatch) {
                    weight = parseInt(weightMatch[1]);
                    affixText = line.substring(0, line.length - weightMatch[1].length).trim();
                    
                    if (!isNaN(weight) && affixText) {
                        currentAffixList.push({
                            "词缀": affixText,
                            "权重": weight
                        });
                    }
                }
            }
        }
    }
    
    // 保存最后一个装备
    if (currentEquipment && currentAffixList.length > 0) {
        result.push({
            "装备类型": currentEquipment,
            "部位": getPosition(currentEquipment),
            "词缀列表": currentAffixList
        });
    }
    
    // 输出结果
    console.log('解析完成！');
    console.log('装备数量:', result.length);
    result.forEach(item => {
        console.log(`  ${item.装备类型} (${item.部位}): ${item.词缀列表.length} 个词缀`);
    });
    
    // 写入文件
    fs.writeFileSync(outputFile, JSON.stringify(result, null, 2), 'utf8');
    console.log(`\n结果已保存到: ${outputFile}`);
    
} catch (error) {
    console.error('解析错误:', error);
}
