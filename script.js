// 全局变量
let currentTab = 'crafting';

// 收割档位数据（由收割.txt动态加载）
let harvestTierData = { tiers: [] };

// JSON数据存储
let gameData = {
    hunzhu: null,           // 魂铸数据
    legendaryEquipment: null, // 传奇装备数据
    erosion: null,          // 异化数据
    towerSequence: null,    // 高塔序列数据
    supportGems: null,      // 辅助宝石数据
    weights: null           // 权重数据
};

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// 初始化应用
function initializeApp() {
    // 首先初始化UI相关功能（确保DOM已加载）
    setupThemeToggle();
    setupSidebarToggle();
    setupTabNavigation();
    setupFormValidation();
    setupAnimations();
    fixImagePaths();
    
    // 先加载JSON数据，再初始化各系统
    loadAllJSONData().then(() => {
        console.log('所有JSON数据加载完成');
        console.log('传奇装备数据检查:', gameData.legendaryEquipment ? '已加载' : '未加载');
        
        // 确保数据加载完成后再初始化各个系统
        setTimeout(async () => {
            // 初始化各个系统（按依赖顺序）
            await initializeDreamSystem();
            initializeSkillSystem();
            initializeSealSystem();
            initializeTowerSystem();
            initializeHarvestTierSystem();
            initializeErosionSimulation();
            await initializeMemoryCrafting();
            setupCraftingEventListeners();
            setupMaterialPriceListeners();
            
            // 延迟加载保存的数据
            setTimeout(() => {
                DataPersistence.loadAllData();
                loadMaterialPrices();
                loadTowerComponentPrices();
            }, 100);
        }, 50); // 给JSON数据加载一点额外时间
    }).catch(error => {
        console.error('加载数据文件失败:', error);
        showNotification('数据文件加载失败，部分功能可能无法正常使用', 'error');
        
        // 即使JSON加载失败，也要初始化基本系统
        setTimeout(async () => {
            await initializeDreamSystem();
            initializeSkillSystem();
            initializeSealSystem();
            initializeTowerSystem();
            initializeHarvestTierSystem();
            initializeErosionSimulation();
            setupCraftingEventListeners();
        }, 100);
    });
    
    // 设置自动保存
    setupAutoSave();
}

// 加载所有JSON数据文件
async function loadAllJSONData() {
    const loadPromises = [
        loadJSONFile('hunzhu.json', 'hunzhu'),
        loadJSONFile('传奇装备.json', 'legendaryEquipment'),
        loadJSONFile('异化.json', 'erosion'),
        loadJSONFile('高塔序列.json', 'towerSequence'),
        loadSupportSkillsData(), // 加载辅助技能数据
        loadJSONFile('quanzhong.JSON', 'weights')
    ];
    
    await Promise.all(loadPromises);
    console.log('所有JSON数据文件加载完成');
}

// 加载单个JSON文件
async function loadJSONFile(filename, dataKey) {
    try {
        const response = await fetch(filename);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        gameData[dataKey] = data;
        console.log(`${filename} 加载成功`);
    } catch (error) {
        console.error(`加载 ${filename} 失败:`, error);
        gameData[dataKey] = null;
        throw error;
    }
}

// 加载辅助技能数据
async function loadSupportSkillsData() {
    try {
        const response = await fetch('辅助.txt');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        const parsedData = parseSupportSkillsText(text);
        gameData.supportGems = parsedData;
        console.log('辅助.txt 加载成功');
    } catch (error) {
        console.error('加载 辅助.txt 失败:', error);
        gameData.supportGems = null;
        throw error;
    }
}

// 解析辅助技能文本数据
function parseSupportSkillsText(text) {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    const data = {
        fixed_skills: {},
        leveled_skills: {}
    };
    
    let currentSkill = null;
    let isLeveledSkill = false;
    let levels = {};
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // 跳过标题行和规则说明
        if (line.includes('技能') && line.includes('魔力封印补偿') && line.includes('魔力消耗倍率')) {
            continue;
        }
        if (line.includes('规则说明')) {
            break; // 到达规则说明部分，停止解析
        }
        
        // 检查是否是技能名称行（包含技能名称和数据）
        if (line.includes('%') && (line.includes('-') || line.includes('0%'))) {
            const parts = line.split(/\s+/);
            if (parts.length >= 3) {
                const skillName = parts[0];
                const compensation = parseFloat(parts[1].replace('%', ''));
                const multiplier = parseFloat(parts[2].replace('%', ''));
                
                data.fixed_skills[skillName] = {
                    compensation: compensation,
                    multiplier: multiplier
                };
            }
        }
        // 检查是否是等级技能的开始
        else if (line.includes('：') && !line.includes('等级')) {
            currentSkill = line.replace('：', '').trim();
            isLeveledSkill = true;
            levels = {};
        }
        // 检查是否是魔力消耗倍率行
        else if (line.includes('魔力消耗倍率') && currentSkill) {
            const multiplierMatch = line.match(/(\d+(?:\.\d+)?)%/);
            if (multiplierMatch) {
                const multiplier = parseFloat(multiplierMatch[1]);
                if (!data.leveled_skills[currentSkill]) {
                    data.leveled_skills[currentSkill] = {};
                }
                data.leveled_skills[currentSkill].multiplier = multiplier;
            }
        }
        // 检查是否是等级数据行
        else if (line.match(/^\d+\s+/) && currentSkill) {
            const parts = line.split(/\s+/);
            if (parts.length >= 2) {
                const level = parseInt(parts[0]);
                const compensation = parseFloat(parts[1].replace('%', ''));
                levels[level] = compensation;
            }
        }
        // 如果遇到新的技能或空行，保存当前等级技能数据
        else if ((line.includes('：') || line === '') && currentSkill && Object.keys(levels).length > 0) {
            if (!data.leveled_skills[currentSkill]) {
                data.leveled_skills[currentSkill] = {};
            }
            data.leveled_skills[currentSkill].compensation_by_level = levels;
            
            if (!line.includes('：')) {
                currentSkill = null;
                isLeveledSkill = false;
                levels = {};
            }
        }
    }
    
    // 保存最后一个等级技能的数据
    if (currentSkill && Object.keys(levels).length > 0) {
        if (!data.leveled_skills[currentSkill]) {
            data.leveled_skills[currentSkill] = {};
        }
        data.leveled_skills[currentSkill].compensation_by_level = levels;
    }
    
    return data;
}

// 填充武器子类型
function populateWeaponSubtypes(weaponType) {
    const weaponSubtypeSelect = document.getElementById('weapon-subtype');
    if (!weaponSubtypeSelect) return;
    
    // 清空现有选项
    weaponSubtypeSelect.innerHTML = '<option value="">请选择武器类型</option>';
    
    // 根据武器类型添加子类型选项
    const subtypes = {
        '单手': ['剑', '斧', '锤', '匕首', '法杖', '弓'],
        '双手': ['双手剑', '双手斧', '双手锤', '长杖', '弩']
    };
    
    if (subtypes[weaponType]) {
        subtypes[weaponType].forEach(subtype => {
            const option = document.createElement('option');
            option.value = subtype;
            option.textContent = subtype;
            weaponSubtypeSelect.appendChild(option);
        });
    }
}

// 收割档位相关功能
// 新的收割档位数据（根据用户提供的1-15档数据）
const newHarvestTierData = [
    { tier: 1, harvestsCount: 30, interval: 0.033, cooldown: 2900.00 },
    { tier: 2, harvestsCount: 15, interval: 0.066, cooldown: 1400 },
    { tier: 3, harvestsCount: 10, interval: 0.1, cooldown: 900 },
    { tier: 4, harvestsCount: 7.5, interval: 0.133, cooldown: 650 },
    { tier: 5, harvestsCount: 6, interval: 0.166, cooldown: 500 },
    { tier: 6, harvestsCount: 5, interval: 0.2, cooldown: 400 },
    { tier: 7, harvestsCount: 4.28, interval: 0.233, cooldown: 328.57 },
    { tier: 8, harvestsCount: 3.75, interval: 0.266, cooldown: 275.00 },
    { tier: 9, harvestsCount: 3.33, interval: 0.3, cooldown: 233.33 },
    { tier: 10, harvestsCount: 3, interval: 0.33, cooldown: 200.00 },
    { tier: 11, harvestsCount: 2.72, interval: 0.36, cooldown: 172.73 },
    { tier: 12, harvestsCount: 2.5, interval: 0.4, cooldown: 150.00 },
    { tier: 13, harvestsCount: 2.3, interval: 0.43, cooldown: 130.77 },
    { tier: 14, harvestsCount: 2.14, interval: 0.46, cooldown: 114.29 },
    { tier: 15, harvestsCount: 2, interval: 0.5, cooldown: 100.00 }
];

// 计算宠物效果
function calculatePetEffect(baseCooldown, petLevel) {
    switch (petLevel) {
        case 'pet1':
            // 1级宠物 额外+25%收割冷却回复速度
            return baseCooldown * (1 + 0.25);
        case 'pet6':
            // 6级宠物 额外+25%*(1+33%)收割冷却回复速度
            return baseCooldown * (1 + 0.25 * (1 + 0.33));
        default:
            return baseCooldown;
    }
}

// 新的收割档位查询计算
function calculateNewHarvestTier() {
    console.log('calculateNewHarvestTier 函数被调用');
    
    const cooldownInput = document.getElementById('current-harvest-cooldown');
    const petSelect = document.getElementById('harvest-pet-level');
    
    console.log('cooldownInput:', cooldownInput);
    console.log('petSelect:', petSelect);
    
    if (!cooldownInput) {
        console.error('未找到 current-harvest-cooldown 元素');
        return;
    }
    
    const currentCooldown = parseFloat(cooldownInput.value) || 0;
    const petLevel = petSelect ? petSelect.value : 'none';
    
    console.log('当前冷却值:', currentCooldown);
    console.log('宠物等级:', petLevel);
    console.log('档位数据:', newHarvestTierData);
    
    // 查找当前档位
    let currentTier = null;
    let nextTier = null;
    
    // 按冷却从高到低查找档位
    for (let i = 0; i < newHarvestTierData.length; i++) {
        const tier = newHarvestTierData[i];
        if (currentCooldown >= tier.cooldown) {
            currentTier = tier;
            // 下一档位是更高要求的档位（数组中的前一个）
            nextTier = i > 0 ? newHarvestTierData[i - 1] : null;
            break;
        }
    }
    
    // 如果低于最低档位，则为最低档位
    if (!currentTier) {
        currentTier = newHarvestTierData[newHarvestTierData.length - 1];
        nextTier = newHarvestTierData.length > 1 ? newHarvestTierData[newHarvestTierData.length - 2] : null;
    }
    
    console.log('找到的当前档位:', currentTier);
    console.log('下一档位:', nextTier);
    
    // 更新显示
    updateNewHarvestTierDisplay(currentTier, nextTier, currentCooldown, petLevel);
}

// 更新新的收割档位显示
function updateNewHarvestTierDisplay(currentTier, nextTier, currentCooldown, petLevel) {
    console.log('updateNewHarvestTierDisplay 函数被调用');
    console.log('参数 - currentTier:', currentTier, 'nextTier:', nextTier, 'currentCooldown:', currentCooldown, 'petLevel:', petLevel);
    
    // 检查所有需要的DOM元素是否存在
    const elements = {
        'current-tier-number': document.getElementById('current-tier-number'),
        'harvest-count': document.getElementById('harvest-count'),
        'trigger-interval': document.getElementById('trigger-interval'),
        'current-cooldown-display': document.getElementById('current-cooldown-display'),
        'next-tier-number': document.getElementById('next-tier-number'),
        'required-improvement': document.getElementById('required-improvement')
    };
    
    console.log('DOM元素检查:', elements);
    
    // 更新当前档位信息
    if (elements['current-tier-number']) {
        elements['current-tier-number'].textContent = currentTier ? currentTier.tier : '-';
        console.log('更新档位号:', currentTier ? currentTier.tier : '-');
    }
    if (elements['harvest-count']) {
        elements['harvest-count'].textContent = currentTier ? currentTier.harvestsCount : '-';
        console.log('更新收割次数:', currentTier ? currentTier.harvestsCount : '-');
    }
    if (elements['trigger-interval']) {
        elements['trigger-interval'].textContent = currentTier ? currentTier.interval : '-';
        console.log('更新触发间隔:', currentTier ? currentTier.interval : '-');
    }
    if (elements['current-cooldown-display']) {
        elements['current-cooldown-display'].textContent = currentTier ? `${currentTier.cooldown}%` : '-';
        console.log('更新收割冷却:', currentTier ? `${currentTier.cooldown}%` : '-');
    }
    
    // 更新下一档位和还需提升
    if (nextTier && elements['next-tier-number']) {
        elements['next-tier-number'].textContent = nextTier.tier;
        
        // 计算还需提升的数值
        const requiredCooldown = nextTier.cooldown;
        const currentValue = currentCooldown || 0;
        const stillNeeded = Math.max(0, requiredCooldown - currentValue);
        
        // 根据宠物等级计算实际需要提升的数值
        let actualNeeded = stillNeeded;
        if (stillNeeded > 0) {
            if (petLevel === 'pet1') {
                // 1级宠物有25%加成
                actualNeeded = stillNeeded / (1 + 0.25);
            } else if (petLevel === 'pet6') {
                // 6级宠物有25% * (1 + 33%) = 33.25%加成
                actualNeeded = stillNeeded / (1 + 0.25 * (1 + 0.33));
            }
            // 无宠物时actualNeeded = stillNeeded，不需要额外计算
        }
        
        if (elements['required-improvement']) {
            elements['required-improvement'].textContent = stillNeeded > 0 ? `${actualNeeded.toFixed(2)}%` : '已达到';
        }
        
        console.log('更新下一档位:', nextTier.tier);
        console.log('还需提升:', stillNeeded > 0 ? `${actualNeeded.toFixed(2)}%` : '已达到');
    } else {
        if (elements['next-tier-number']) {
            elements['next-tier-number'].textContent = '已达最高档位';
        }
        if (elements['required-improvement']) {
            elements['required-improvement'].textContent = '-';
        }
        console.log('已达最高档位');
    }
}

// 解析收割.txt文本为档位数据（保留原有功能用于数据表显示）
function parseHarvestDataText(text) {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    const tiers = [];
    let current = null;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith('档位：')) {
            if (current) tiers.push(current);
            const tierNum = parseInt(line.replace('档位：', '').trim(), 10);
            current = { tier: tierNum, harvestsCount: null, interval: null, cooldownNoPet: null, cooldownPet1: null, cooldownPet6: null };
        } else if (line.startsWith('收割次数：') && current) {
            const val = parseFloat(line.replace('收割次数：', '').trim());
            current.harvestsCount = isNaN(val) ? null : val;
        } else if (line.startsWith('触发间隔：') && current) {
            const val = parseFloat(line.replace('触发间隔：', '').trim());
            current.interval = isNaN(val) ? null : val;
        } else if (line.includes('无宠物：') && current) {
            const num = line.split('无宠物：')[1]?.replace('%', '').trim();
            const val = parseFloat(num);
            current.cooldownNoPet = isNaN(val) ? null : val;
        } else if (line.includes('1级宠物：') && current) {
            const num = line.split('1级宠物：')[1]?.replace('%', '').trim();
            const val = parseFloat(num);
            current.cooldownPet1 = isNaN(val) ? null : val;
        } else if (line.includes('6级宠物：') && current) {
            const num = line.split('6级宠物：')[1]?.replace('%', '').trim();
            const val = parseFloat(num);
            current.cooldownPet6 = isNaN(val) ? null : val;
        }
    }
    if (current) tiers.push(current);

    // 过滤不完整条目并按冷却（无宠物）从高到低排序
    return tiers.filter(t => t.tier != null && t.cooldownNoPet != null)
                .sort((a, b) => b.cooldownNoPet - a.cooldownNoPet);
}

// 从文件加载收割档位数据
async function loadHarvestTierDataFromFile() {
    try {
        const resp = await fetch('收割.txt');
        const text = await resp.text();
        harvestTierData.tiers = parseHarvestDataText(text);
    } catch (e) {
        console.error('加载收割档位数据失败:', e);
        harvestTierData.tiers = [];
    }
}

// 初始化收割档位表格（使用新数据）
function initializeHarvestTierTable() {
    const tableBody = document.querySelector('#harvest-tier-table tbody');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    // 使用新的档位数据
    newHarvestTierData.forEach(tier => {
        // 计算1级宠物和6级宠物的冷却值
        const pet1Cooldown = (tier.cooldown / (1 + 0.25)).toFixed(2);
        const pet6Cooldown = (tier.cooldown / (1 + 0.25 * (1 + 0.33))).toFixed(2);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${tier.tier}</td>
            <td>${tier.harvestsCount.toFixed(2)}</td>
            <td>${tier.interval.toFixed(3)}秒</td>
            <td>${tier.cooldown.toFixed(2)}%</td>
            <td>${pet1Cooldown}%</td>
            <td>${pet6Cooldown}%</td>
        `;
        tableBody.appendChild(row);
    });
}

// 初始化收割档位系统
async function initializeHarvestTierSystem() {
    console.log('开始初始化收割档位系统');
    
    // 初始化表格
    initializeHarvestTierTable();
    
    // 添加事件监听器
    const cooldownInput = document.getElementById('current-harvest-cooldown');
    const petSelect = document.getElementById('harvest-pet-level');
    
    console.log('DOM元素检查:');
    console.log('cooldownInput:', cooldownInput);
    console.log('petSelect:', petSelect);
    
    if (cooldownInput) {
        console.log('为输入框添加事件监听器');
        cooldownInput.addEventListener('input', function() {
            console.log('输入框input事件触发');
            calculateNewHarvestTier();
        });
        cooldownInput.addEventListener('wheel', function(event) {
            console.log('输入框wheel事件触发');
            event.preventDefault();
            const delta = event.deltaY > 0 ? -1 : 1;
            const currentValue = parseFloat(this.value) || 0;
            this.value = Math.max(0, currentValue + delta);
            calculateNewHarvestTier();
        });
    } else {
        console.error('未找到current-harvest-cooldown元素');
    }
    
    if (petSelect) {
        console.log('为选择框添加事件监听器');
        petSelect.addEventListener('change', function() {
            console.log('选择框change事件触发');
            calculateNewHarvestTier();
        });
    } else {
        console.error('未找到harvest-pet-level元素');
    }
    
    // 初始计算
    console.log('执行初始计算');
    calculateNewHarvestTier();
    
    console.log('收割档位系统初始化完成');
}


// 技能系统数据和函数
const skillUpgradeData = {
    // 升级所需经验和灵感素
    requirements: {
        '1-2': { exp: 5, inspiration: 50 },
        '2-3': { exp: 10, inspiration: 100 },
        '3-4': { exp: 15, inspiration: 150 },
        '4-5': { exp: 20, inspiration: 200 }
    },
    // T级材料提供的经验值（需要根据实际游戏数据调整）
    materialExp: {
        't0': 10,  // T0材料每个提供10点经验
        't1': 5,   // T1材料每个提供5点经验
        't2': 2    // T2材料每个提供2点经验
    }
};

// 封印系统数据和函数
const supportSkillsData = {
    // 固定魔力封印补偿的技能
    fixedSkills: {
        '贯注强化': { compensation: 0, multiplier: 100 },
        '精密 贯注强化': { compensation: -15, multiplier: 100 },
        '贯注增效': { compensation: -30, multiplier: 100 },
        '精密 贯注增效': { compensation: -18, multiplier: 100 },
        '激流': { compensation: -30, multiplier: 100 },
        '精密 激流': { compensation: -14.5, multiplier: 100 },
        '精密 超能共生': { compensation: -20, multiplier: 100 },
        '精密 魔灵之友': { compensation: -30, multiplier: 100 },
        '精密 封印转化': { compensation: -60, multiplier: 100 },
        '精密 无私': { compensation: -12, multiplier: 100 },
        '精密 自私': { compensation: -12, multiplier: 100 },
        '精密 多则能成': { compensation: 0, multiplier: 100 },
        '精密 律己': { compensation: -20.9, multiplier: 100 },
        '精密 全神贯注': { compensation: 0, multiplier: 100 },
        '精密 遇强则强': { compensation: -15, multiplier: 100 },
        '精密 人多势众': { compensation: -12, multiplier: 100 },
        '精密 保护力场': { compensation: -30, multiplier: 100 },
        '保护力场': { compensation: -30, multiplier: 100 },
        '魔灵之友': { compensation: -30, multiplier: 100 }
    },
    
    // 等级相关魔力封印补偿的技能
    levelBasedSkills: {
        '精密 封印转化': {
            levels: {
                1: -60, 2: -60, 3: -60, 4: -60, 5: -60,
                6: -60, 7: -60, 8: -60, 9: -60, 10: -60,
                11: -60, 12: -60, 13: -60, 14: -60, 15: -60,
                16: -60, 17: -60, 18: -60, 19: -60, 20: -60
            }
        },
        '封印转化': {
            levels: {
                1: -60, 2: -60, 3: -60, 4: -60, 5: -60,
                6: -60, 7: -60, 8: -60, 9: -60, 10: -60,
                11: -60, 12: -60, 13: -60, 14: -60, 15: -60,
                16: -60, 17: -60, 18: -60, 19: -60, 20: -60
            }
        }
    }
};

// 获取辅助技能魔力封印补偿
function getSupportSkillCompensation(skillName, level) {
    if (supportSkillsData.fixedSkills[skillName]) {
        return supportSkillsData.fixedSkills[skillName].compensation;
    }
    
    if (supportSkillsData.levelBasedSkills[skillName]) {
        return supportSkillsData.levelBasedSkills[skillName].levels[level] || 0;
    }
    
    return 0;
}

function initializeSkillSystem() {
    const currentLevelSelect = document.getElementById('current-level');
    const targetLevelSelect = document.getElementById('target-level');
    
    // 如果元素不存在，说明当前不在技能系统页面，直接返回
    if (!currentLevelSelect || !targetLevelSelect) {
        console.log('技能系统元素未找到，跳过初始化');
        return;
    }
    
    // 当前等级变化时更新目标等级选项
    if (currentLevelSelect) {
        currentLevelSelect.addEventListener('change', function() {
            const currentLevel = parseInt(this.value);
            if (targetLevelSelect) {
                targetLevelSelect.innerHTML = '';
                
                for (let i = currentLevel + 1; i <= 5; i++) {
                    const option = document.createElement('option');
                    option.value = i;
                    option.textContent = i + '级';
                    targetLevelSelect.appendChild(option);
                }
            }
        });
        
        // 初始化目标等级选项
        currentLevelSelect.dispatchEvent(new Event('change'));
    }
    
    // 添加数量输入框的滚轮事件
    ['t0-quantity', 't1-quantity', 't2-quantity'].forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('wheel', function(e) {
                e.preventDefault();
                const currentValue = parseInt(this.value) || 0;
                const delta = e.deltaY > 0 ? -1 : 1;
                const newValue = Math.max(0, currentValue + delta);
                this.value = newValue;
                
                // 触发计算更新
                calculateSkillUpgrade();
            });
        }
    });
    
    // 添加输入变化事件监听
    ['current-level', 'target-level', 'inspiration-price', 't0-quantity', 't0-price', 't1-quantity', 't1-price', 't2-quantity', 't2-price'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', calculateSkillUpgrade);
            element.addEventListener('input', calculateSkillUpgrade);
        } else {
            console.log(`技能系统元素未找到: ${id}`);
        }
    });
    
    console.log('技能系统初始化完成');
}

function calculateSkillUpgrade() {
    const currentLevel = parseInt(document.getElementById('current-level')?.value) || 1;
    const targetLevel = parseInt(document.getElementById('target-level')?.value) || 1;
    const inspirationPrice = parseFloat(document.getElementById('inspiration-price')?.value) || 0;
    
    const t0Quantity = parseInt(document.getElementById('t0-quantity')?.value) || 0;
    const t0Price = parseFloat(document.getElementById('t0-price')?.value) || 0;
    const t1Quantity = parseInt(document.getElementById('t1-quantity')?.value) || 0;
    const t1Price = parseFloat(document.getElementById('t1-price')?.value) || 0;
    const t2Quantity = parseInt(document.getElementById('t2-quantity')?.value) || 0;
    const t2Price = parseFloat(document.getElementById('t2-price')?.value) || 0;
    
    if (!targetLevel || targetLevel <= currentLevel) {
        // 重置显示
        const totalExpElement = document.getElementById('total-exp-needed');
        const currentExpElement = document.getElementById('current-exp-provided');
        const inspirationElement = document.getElementById('inspiration-needed');
        const totalCostElement = document.getElementById('total-cost');
        
        if (totalExpElement) totalExpElement.textContent = '0';
        if (currentExpElement) currentExpElement.textContent = '0';
        if (inspirationElement) inspirationElement.textContent = '0';
        if (totalCostElement) totalCostElement.textContent = '0 初火源质';
        return;
    }
    
    // 计算所需总经验和灵感素
    let totalExpNeeded = 0;
    let totalInspirationNeeded = 0;
    
    for (let level = currentLevel; level < targetLevel; level++) {
        const key = `${level}-${level + 1}`;
        if (skillUpgradeData.requirements[key]) {
            totalExpNeeded += skillUpgradeData.requirements[key].exp;
            totalInspirationNeeded += skillUpgradeData.requirements[key].inspiration;
        }
    }
    
    // 计算当前材料提供的经验
    const currentExpProvided = 
        t0Quantity * skillUpgradeData.materialExp.t0 +
        t1Quantity * skillUpgradeData.materialExp.t1 +
        t2Quantity * skillUpgradeData.materialExp.t2;
    
    // 计算总成本
    const materialCost = t0Quantity * t0Price + t1Quantity * t1Price + t2Quantity * t2Price;
    const inspirationCost = totalInspirationNeeded * inspirationPrice;
    const totalCost = materialCost + inspirationCost;
    
    // 更新显示
    const totalExpElement = document.getElementById('total-exp-needed');
    const currentExpElement = document.getElementById('current-exp-provided');
    const inspirationElement = document.getElementById('inspiration-needed');
    const totalCostElement = document.getElementById('total-cost');
    
    if (totalExpElement) totalExpElement.textContent = totalExpNeeded;
    if (currentExpElement) currentExpElement.textContent = currentExpProvided;
    if (inspirationElement) inspirationElement.textContent = totalInspirationNeeded;
    if (totalCostElement) totalCostElement.textContent = totalCost.toFixed(2) + ' 初火源质';
    
    // 如果经验不足，显示警告颜色
    if (currentExpElement) {
        if (currentExpProvided < totalExpNeeded) {
            currentExpElement.style.color = '#ff6b6b';
        } else {
            currentExpElement.style.color = '#4a9eff';
        }
    }
}

// 设置标签页导航
function setupTabNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');
    
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // 移除所有活动状态
            navItems.forEach(nav => nav.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // 添加活动状态
            this.classList.add('active');
            const targetTab = document.getElementById(tabId);
            if (targetTab) {
                targetTab.classList.add('active');
                currentTab = tabId;
            }
            
            // 添加切换动画
            if (targetTab) {
                targetTab.style.opacity = '0';
                targetTab.style.transform = 'translateY(20px)';
                
                setTimeout(() => {
                    targetTab.style.transition = 'all 0.5s ease';
                    targetTab.style.opacity = '1';
                    targetTab.style.transform = 'translateY(0)';
                }, 50);
            }
        });
    });
}

// 设置表单验证
function setupFormValidation() {
    const numberInputs = document.querySelectorAll('input[type="number"]');
    
    numberInputs.forEach(input => {
        input.addEventListener('input', function() {
            if (this.value < 0) {
                this.value = 0;
            }
            
            // 添加输入动画效果
            this.style.transform = 'scale(1.02)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);
        });
        
        input.addEventListener('focus', function() {
            if (this.parentElement) {
                this.parentElement.style.transform = 'translateY(-2px)';
            }
        });
        
        input.addEventListener('blur', function() {
            if (this.parentElement) {
                this.parentElement.style.transform = 'translateY(0)';
            }
        });
    });
}

// 设置动画效果
function setupAnimations() {
    // 为模块卡片添加进入动画
    const moduleCards = document.querySelectorAll('.module-card');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.1
    });
    
    moduleCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = `all 0.6s ease ${index * 0.1}s`;
        observer.observe(card);
    });
}

// 打造系统计算函数
function calculateCraftingCost() {
    try {
        // 获取装备参数
        const weaponTypeElement = document.querySelector('input[name="weapon-type"]:checked');
        const equipmentLevelElement = document.querySelector('input[name="equipment-level"]:checked');
        
        if (!weaponTypeElement || !equipmentLevelElement) {
            showNotification('请选择武器类型和装备等级', 'warning');
            return;
        }
        
        const weaponType = weaponTypeElement.value;
        const equipmentLevel = equipmentLevelElement.value;
        
        // 获取词缀选择
        const affixCategories = document.querySelectorAll('.affix-category');
        const affixes = {
            basic: 0, basicT0: 0, basicUpgrade: 0,
            advanced: 0, advancedT0: 0, advancedUpgrade: 0,
            perfect: 0, perfectT0: 0, perfectUpgrade: 0
        };
        
        if (affixCategories.length >= 3) {
            // 基础词缀
            const basicSelects = affixCategories[0].querySelectorAll('select');
            if (basicSelects.length >= 3) {
                affixes.basic = parseInt(basicSelects[0].value) || 0;
                affixes.basicT0 = parseInt(basicSelects[1].value) || 0;
                affixes.basicUpgrade = parseInt(basicSelects[2].value) || 0;
            }
            
            // 高级词缀
            const advancedSelects = affixCategories[1].querySelectorAll('select');
            if (advancedSelects.length >= 3) {
                affixes.advanced = parseInt(advancedSelects[0].value) || 0;
                affixes.advancedT0 = parseInt(advancedSelects[1].value) || 0;
                affixes.advancedUpgrade = parseInt(advancedSelects[2].value) || 0;
            }
            
            // 完美词缀
            const perfectSelects = affixCategories[2].querySelectorAll('select');
            if (perfectSelects.length >= 3) {
                affixes.perfect = parseInt(perfectSelects[0].value) || 0;
                affixes.perfectT0 = parseInt(perfectSelects[1].value) || 0;
                affixes.perfectUpgrade = parseInt(perfectSelects[2].value) || 0;
            }
        }
        
        // 获取材料价格
        const materials = {
            lingsha: parseFloat(document.getElementById('lingsha-price')?.value) || 0,
            chuhuo: 1, // 初火源质恒定为1，不需要输入框
            zhengui: parseFloat(document.getElementById('zhengui-price')?.value) || 0,
            xishi: parseFloat(document.getElementById('xishi-price')?.value) || 0,
            zhizhen: parseFloat(document.getElementById('zhizhen-price')?.value) || 0,
            shensheng: parseFloat(document.getElementById('shensheng-price')?.value) || 0
        };
        
        // 打造数据配置
        const craftingData = {
            82: {
                single: {
                    basic: { materials: { lingsha: 5, zhengui: 1 }, successRate: 0.035 },
                    advanced: { materials: { lingsha: 15, xishi: 1 }, successRate: 0.035 }
                },
                double: {
                    basic: { materials: { lingsha: 10, zhengui: 2 }, successRate: 0.035 },
                    advanced: { materials: { lingsha: 30, xishi: 2 }, successRate: 0.035 }
                }
            },
            86: {
                single: {
                    basic: { materials: { chuhuo: 1, zhengui: 10 }, successRate: 0.0333 },
                    advanced: { materials: { chuhuo: 3, xishi: 10 }, successRate: 0.0333 }
                },
                double: {
                    basic: { materials: { chuhuo: 2, zhengui: 20 }, successRate: 0.0333 },
                    advanced: { materials: { chuhuo: 6, xishi: 20 }, successRate: 0.0333 }
                }
            },
            100: {
                single: {
                    basic: { materials: { chuhuo: 1, zhengui: 10 }, successRate: 0.01 },
                    advanced: { materials: { chuhuo: 3, xishi: 10 }, successRate: 0.01 },
                    perfect: { materials: { chuhuo: 30, zhizhen: 1 }, successRate: 0.05 },
                    basicUpgrade: { materials: { chuhuo: 30, zhengui: 300, shensheng: 1 }, successRate: 0.3 },
                    advancedUpgrade: { materials: { chuhuo: 90, xishi: 300, shensheng: 3 }, successRate: 0.3 },
                    perfectUpgrade: { materials: { chuhuo: 180, zhizhen: 6, shensheng: 6 }, successRate: 0.3 }
                },
                double: {
                    basic: { materials: { chuhuo: 2, zhengui: 20 }, successRate: 0.01 },
                    advanced: { materials: { chuhuo: 6, xishi: 20 }, successRate: 0.01 },
                    perfect: { materials: { chuhuo: 60, zhizhen: 2 }, successRate: 0.05 },
                    basicUpgrade: { materials: { chuhuo: 60, zhengui: 600, shensheng: 2 }, successRate: 0.3 },
                    advancedUpgrade: { materials: { chuhuo: 180, xishi: 600, shensheng: 6 }, successRate: 0.3 },
                    perfectUpgrade: { materials: { chuhuo: 360, zhizhen: 12, shensheng: 12 }, successRate: 0.3 }
                }
            }
        };
        
        let totalCost = 0;
        const levelData = craftingData[equipmentLevel]?.[weaponType];
        
        if (!levelData) {
            showNotification('未找到对应的打造数据配置', 'error');
            return;
        }
        
        // 计算各种词缀的成本
        const affixTypes = [
            { count: affixes.basic, type: 'basic' },
            { count: affixes.basicT0, type: 'basicT0' },
            { count: affixes.basicUpgrade, type: 'basicUpgrade' },
            { count: affixes.advanced, type: 'advanced' },
            { count: affixes.advancedT0, type: 'advancedT0' },
            { count: affixes.advancedUpgrade, type: 'advancedUpgrade' },
            { count: affixes.perfect, type: 'perfect' },
            { count: affixes.perfectT0, type: 'perfectT0' },
            { count: affixes.perfectUpgrade, type: 'perfectUpgrade' }
        ];

        // 辅助函数：计算某配置的期望成本
        const computeExpectedCost = (config) => {
            if (!config) return 0;
            let singleCost = 0;
            Object.keys(config.materials).forEach(materialKey => {
                const materialCount = config.materials[materialKey];
                const materialPrice = materials[materialKey];
                singleCost += materialCount * materialPrice;
            });
            return singleCost / config.successRate;
        };

        affixTypes.forEach(affix => {
            if (affix.count > 0) {
                let expectedCostForType = 0;

                // T0 成本 = 基础成本 + 对应升级成本
                if (affix.type.endsWith('T0')) {
                    const baseType = affix.type.replace('T0', '');
                    const baseConfig = levelData[baseType];
                    const upgradeConfig = levelData[`${baseType}Upgrade`];
                    expectedCostForType = computeExpectedCost(baseConfig) + computeExpectedCost(upgradeConfig);
                } else {
                    const config = levelData[affix.type];
                    expectedCostForType = computeExpectedCost(config);
                }

                totalCost += expectedCostForType * affix.count;
            }
        });
        
        // 合并解梦与序列成本（可选）
        const baseCost = totalCost;
        const includeDream = document.getElementById('include-dream-cost')?.checked || false;
        const includeSequence = document.getElementById('include-sequence-cost')?.checked || false;

        let dreamCost = 0;
        let sequenceCost = 0;

        if (includeDream) {
            dreamCost = computeDreamCost();
        }
        if (includeSequence) {
            sequenceCost = computeSequenceCost();
        }

        const dreamItem = document.getElementById('dream-cost-item');
        const sequenceItem = document.getElementById('sequence-cost-item');
        if (dreamItem) dreamItem.style.display = includeDream ? 'flex' : 'none';
        if (sequenceItem) sequenceItem.style.display = includeSequence ? 'flex' : 'none';

        const grandTotal = baseCost + dreamCost + sequenceCost;

        // 显示结果
        const totalResultElement = document.getElementById('crafting-total-result');
        const baseCostElement = document.getElementById('crafting-base-cost');
        const craftingDreamCostElement = document.getElementById('crafting-dream-cost');
        const craftingSequenceCostElement = document.getElementById('crafting-sequence-cost');
        
        if (totalResultElement) {
            totalResultElement.textContent = `${grandTotal.toFixed(2)} 初火源质`;
            
            // 添加结果动画
            totalResultElement.style.transform = 'scale(1.1)';
            totalResultElement.style.color = '#ff6b6b';
            setTimeout(() => {
                totalResultElement.style.transform = 'scale(1)';
            }, 300);
        }
        
        if (baseCostElement) {
            baseCostElement.textContent = `${baseCost.toFixed(2)} 初火源质`;
        }

        if (craftingDreamCostElement) {
            craftingDreamCostElement.textContent = `${dreamCost.toFixed(2)} 初火源质`;
        }
        if (craftingSequenceCostElement) {
            craftingSequenceCostElement.textContent = `${sequenceCost.toFixed(2)} 初火源质`;
        }
        
        // 显示成功提示
        showNotification('计算完成！', 'success');
        
        // 保存材料价格到本地存储
        saveMaterialPrices(materials);
        
    } catch (error) {
        console.error('计算错误:', error);
        showNotification('计算出错，请检查输入数据', 'error');
    }
}

// 计算并返回当前解梦成本（用于打造总成本合并）
function computeDreamCost() {
    try {
        const dreamPosition = document.getElementById('dream-position')?.value;
        const dreamType = document.getElementById('dream-type')?.value;
        const dreamLevel = parseInt(document.getElementById('dream-level')?.value);
        const affixValue = document.getElementById('dream-affix')?.value;
        const selectedAffixIndex = affixValue !== undefined ? parseInt(affixValue) : NaN;

        const weaponPrice = parseFloat(document.getElementById('dream-weapon-price')?.value) || 0;
        const accessoryPrice = parseFloat(document.getElementById('dream-accessory-price')?.value) || 0;

        if (!dreamPosition || !dreamType) return 0;
        if (isNaN(selectedAffixIndex)) return 0;

        const isAccessory = dreamData[dreamPosition]?.isAccessory;
        const finalMaterialPrice = isAccessory ? accessoryPrice : weaponPrice;
        if (finalMaterialPrice <= 0) return 0;

        let affixes = [];

        if (affixData && Array.isArray(affixData)) {
            let targetEquipmentType = '';
            if (dreamPosition === 'weapon') {
                const weaponTypeMap = {
                    'claw': '爪',
                    'dagger': '匕首',
                    'one_hand_sword': '单手剑',
                    'one_hand_hammer': '单手锤',
                    'one_hand_axe': '单手斧',
                    'staff': '法杖',
                    'spirit_staff': '灵杖',
                    'magic_wand': '魔杖',
                    'hand_staff': '手杖',
                    'pistol': '手枪',
                    'two_hand_sword': '双手剑',
                    'two_hand_hammer': '双手锤',
                    'two_hand_axe': '双手斧',
                    'tin_staff': '锡杖',
                    'war_staff': '武杖',
                    'bow': '弓',
                    'crossbow': '弩',
                    'rifle': '火枪',
                    'cannon': '火炮'
                };
                targetEquipmentType = weaponTypeMap[dreamType] || dreamType;
            } else if (dreamPosition === 'accessory') {
                const accessoryTypeMap = {
                    'ring': '戒指',
                    'necklace': '项链',
                    'belt': '腰带'
                };
                targetEquipmentType = accessoryTypeMap[dreamType] || dreamType;
            }

            const equipmentData = affixData.find(item => item.装备类型 === targetEquipmentType);
            if (equipmentData && equipmentData.词缀列表) {
                affixes = equipmentData.词缀列表
                    .filter(affix => affix.权重 && affix.权重 > 0)
                    .map(affix => ({ name: affix.词缀, weight: affix.权重 }));
            }
        }

        if (affixes.length === 0) {
            if (dreamPosition === 'weapon' && weaponAffixes[dreamType]) {
                affixes = weaponAffixes[dreamType];
            } else if (dreamPosition === 'accessory' && accessoryAffixes[dreamType]) {
                affixes = accessoryAffixes[dreamType];
            }
        }

        if (!affixes[selectedAffixIndex]) return 0;
        const selectedAffix = affixes[selectedAffixIndex];
        const totalWeight = affixes.reduce((sum, affix) => sum + (affix.weight || 0), 0);
        if (totalWeight <= 0) return 0;

        let materialCount;
        switch (dreamLevel) {
            case 82: materialCount = 1; break;
            case 86: materialCount = 2; break;
            case 100: materialCount = 3; break;
            default: materialCount = 1;
        }

        const singleProbability = selectedAffix.weight / totalWeight;
        const dreamProbability = 1 - Math.pow(1 - singleProbability, 3);
        const cost = (finalMaterialPrice * materialCount) / dreamProbability;

        const elem = document.getElementById('crafting-dream-cost');
        if (elem) elem.textContent = `${cost.toFixed(2)} 初火源质`;
        return cost;
    } catch (e) {
        return 0;
    }
}

// 计算并返回当前序列期望成本（用于打造总成本合并）
function computeSequenceCost() {
    try {
        const sequence = document.getElementById('target-sequence')?.value.trim() || '';
        if (!/^[1-7]{3,4}$/.test(sequence)) {
            const seqElem = document.getElementById('crafting-sequence-cost');
            if (seqElem) seqElem.textContent = `0 初火源质`;
            return 0;
        }

        // 获取武器参数与研究类型
        const weaponType = document.getElementById('weapon-type')?.value;
        const weaponLevel = document.getElementById('weapon-level')?.value;
        const weaponCategory = document.getElementById('weapon-category')?.value;
        const researchType = document.getElementById('research-type')?.value;

        // 依据新规则获取材料并计算单次成本
        const materials = calculateRequiredMaterials(weaponType, weaponLevel, weaponCategory, researchType, gameData.towerSequence || getDefaultTowerData());
        const prices = getTowerComponentPrices();
        let singleCost = 0;
        const fireEssence = materials['初火源质'] || 0;
        singleCost += fireEssence;
        const componentMap = {
            '基础元件': 'basic',
            '拓展元件-术士': 'caster',
            '拓展元件-近卫': 'guard',
            '拓展元件-狙击': 'sniper',
            '拓展元件-重装': 'defense'
        };
        for (const [name, count] of Object.entries(materials)) {
            if (name === '初火源质') continue;
            const key = componentMap[name];
            const unitPrice = key ? (prices[key] || 0) : 0;
            singleCost += (count || 0) * unitPrice;
        }

        // 复杂度选择：3位用“普通”，4位用“深度”
        const pattern = analyzeSequencePattern(sequence);
        const complexity = sequence.length === 4 ? '深度' : '普通';
        const patternData = towerSystemData.patterns[complexity] || {};
        const successProbability = patternData[pattern] || 1.0;
        const expectedCost = singleCost / (successProbability / 100);

        const elem = document.getElementById('crafting-sequence-cost');
        if (elem) elem.textContent = `${expectedCost.toFixed(2)} 初火源质`;
        return expectedCost;
    } catch (e) {
        return 0;
    }
}

// 保存材料价格
function saveMaterialPrices(materials) {
    // 不保存初火源质价格，因为它是固定的
    const pricesForSave = {
        lingsha: materials.lingsha,
        zhengui: materials.zhengui,
        xishi: materials.xishi,
        zhizhen: materials.zhizhen,
        shensheng: materials.shensheng,
        dreamWeapon: materials.dreamWeapon,
        dreamAccessory: materials.dreamAccessory
    };
    localStorage.setItem('torchlight-material-prices', JSON.stringify(pricesForSave));
}

// 加载材料价格
function loadMaterialPrices() {
    const saved = localStorage.getItem('torchlight-material-prices');
    if (saved) {
        try {
            const materials = JSON.parse(saved);
            const lingshaInput = document.getElementById('lingsha-price');
            const zhenguiInput = document.getElementById('zhengui-price');
            const xishiInput = document.getElementById('xishi-price');
            const zhizhenInput = document.getElementById('zhizhen-price');
            const shenshengInput = document.getElementById('shensheng-price');
            
            // 装备打造系统材料价格
            if (lingshaInput) lingshaInput.value = materials.lingsha || '';
            if (zhenguiInput) zhenguiInput.value = materials.zhengui || '';
            if (xishiInput) xishiInput.value = materials.xishi || '';
            if (zhizhenInput) zhizhenInput.value = materials.zhizhen || '';
            if (shenshengInput) shenshengInput.value = materials.shensheng || '';
            
            // 解梦系统材料价格
            const dreamWeaponInput = document.getElementById('dream-weapon-price');
            const dreamAccessoryInput = document.getElementById('dream-accessory-price');
            if (dreamWeaponInput && materials.dreamWeapon) dreamWeaponInput.value = materials.dreamWeapon;
            if (dreamAccessoryInput && materials.dreamAccessory) dreamAccessoryInput.value = materials.dreamAccessory;
            
        } catch (e) {
            console.error('加载材料价格失败:', e);
        }
    }
}

// 设置材料价格输入框的事件监听器
function setupMaterialPriceListeners() {
    console.log('设置材料价格输入框事件监听器');
    
    const materialPriceInputs = [
        'lingsha-price',
        'zhengui-price', 
        'xishi-price',
        'zhizhen-price',
        'shensheng-price',
        'dream-weapon-price',
        'dream-accessory-price'
    ];
    
    materialPriceInputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            // 添加输入变化事件监听器
            element.addEventListener('input', saveMaterialPricesFromInputs);
            element.addEventListener('change', saveMaterialPricesFromInputs);
            console.log(`为 ${id} 添加了事件监听器`);
        } else {
            console.warn(`未找到元素: ${id}`);
        }
    });
}

// 从输入框保存材料价格
function saveMaterialPricesFromInputs() {
    const materials = {
        lingsha: parseFloat(document.getElementById('lingsha-price')?.value) || 0,
        zhengui: parseFloat(document.getElementById('zhengui-price')?.value) || 0,
        xishi: parseFloat(document.getElementById('xishi-price')?.value) || 0,
        zhizhen: parseFloat(document.getElementById('zhizhen-price')?.value) || 0,
        shensheng: parseFloat(document.getElementById('shensheng-price')?.value) || 0,
        dreamWeapon: parseFloat(document.getElementById('dream-weapon-price')?.value) || 0,
        dreamAccessory: parseFloat(document.getElementById('dream-accessory-price')?.value) || 0
    };
    
    // 只保存非零价格
    const pricesForSave = {};
    Object.keys(materials).forEach(key => {
        if (materials[key] > 0) {
            pricesForSave[key] = materials[key];
        }
    });
    
    localStorage.setItem('torchlight-material-prices', JSON.stringify(pricesForSave));
    console.log('材料价格已自动保存:', pricesForSave);
}

// 修复图片路径
function fixImagePaths() {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        img.addEventListener('error', function() {
            if (!this.dataset.tried) {
                this.dataset.tried = true;
                const originalSrc = this.src;
                this.src = encodeURI(originalSrc);
            }
        });
    });
}

// 减伤计算函数
function calculateDamageReduction() {
    try {
        const drRows = document.querySelectorAll('.dr-row');
        let sourceReductions = []; // 存储每个序号来源的减伤值
        
        drRows.forEach((row, index) => {
            const methodSelect = row.querySelector('.dr-method');
            const layersInput = row.querySelector('.dr-layers');
            const percentInput = row.querySelector('.dr-percent');
            
            if (!methodSelect || !layersInput || !percentInput) return;
            
            const method = methodSelect.value;
            const layers = parseInt(layersInput.value) || 0;
            const percent = parseFloat(percentInput.value) || 0;
            
            if (layers > 0 && percent > 0) {
                let sourceReduction = 0;
                
                if (method === 'additive') {
                    // 加法减伤：层数 × 每层减伤
                    sourceReduction = layers * percent;
                } else if (method === 'multiply') {
                    // 乘法减伤：(1 - N₁%) × (1 - N₂%) × ... × (1 - Nₘ%)
                    // 每层减伤N在层数M下的计算公式为：1 - (1 - N%)^M
                    let multiplicativeResult = 1;
                    for (let i = 0; i < layers; i++) {
                        multiplicativeResult *= (1 - percent / 100);
                    }
                    sourceReduction = (1 - multiplicativeResult) * 100;
                }
                
                // 将该序号来源的减伤值添加到数组中
                if (sourceReduction > 0) {
                    sourceReductions.push(sourceReduction);
                }
            }
        });
        
        // 总减伤：所有序号来源的减伤相加
        const totalReduction = Math.min(sourceReductions.reduce((sum, reduction) => sum + reduction, 0), 100);
        
        // 显示结果
        const resultElement = document.getElementById('dr-result');
        if (resultElement) {
            resultElement.innerHTML = `总减伤：${totalReduction.toFixed(2)}%`;
            
            // 显示详细计算过程
            let detailText = '';
            sourceReductions.forEach((reduction, index) => {
                detailText += `序号${index + 1}：${reduction.toFixed(2)}% `;
            });
            if (detailText) {
                resultElement.innerHTML += ` <span class="dr-detail">(${detailText.trim()})</span>`;
            }
            
            // 添加结果动画
            resultElement.style.transform = 'scale(1.1)';
            setTimeout(() => {
                resultElement.style.transform = 'scale(1)';
            }, 300);
        }
        
        showNotification('减伤计算完成！', 'success');
        
    } catch (error) {
        console.error('减伤计算错误:', error);
        showNotification('减伤计算出错，请检查输入数据', 'error');
    }
}

// 叠乘增伤计算函数
function calculateMultiplyDamage() {
    try {
        const singleIncreaseInput = document.getElementById('single-damage-increase');
        const multiplyTimesInput = document.getElementById('multiply-times');
        
        if (!singleIncreaseInput || !multiplyTimesInput) {
            showNotification('找不到输入元素', 'error');
            return;
        }
        
        const singleIncrease = parseFloat(singleIncreaseInput.value) || 0;
        const multiplyTimes = parseInt(multiplyTimesInput.value) || 0;
        
        if (singleIncrease <= 0 || multiplyTimes <= 0) {
            showNotification('请输入有效的增伤数值和叠乘次数', 'warning');
            return;
        }
        
        // 叠乘增伤计算：(1 + 单次增伤%)^叠乘次数 - 1
        const totalIncrease = Math.pow(1 + singleIncrease / 100, multiplyTimes) - 1;
        const totalIncreasePercent = totalIncrease * 100;
        
        // 显示结果
        const resultElement = document.getElementById('multiply-damage-result');
        if (resultElement) {
            resultElement.innerHTML = `叠乘增伤：${totalIncreasePercent.toFixed(2)}%`;
            
            // 添加结果动画
            resultElement.style.transform = 'scale(1.1)';
            resultElement.style.color = '#4a9eff';
            setTimeout(() => {
                resultElement.style.transform = 'scale(1)';
            }, 300);
        }
        
        showNotification('叠乘增伤计算完成！', 'success');
        
    } catch (error) {
        console.error('叠乘增伤计算错误:', error);
        showNotification('叠乘增伤计算出错，请检查输入数据', 'error');
    }
}

// 伤害提升计算函数
function calculateDamageImprovement() {
    try {
        const damageBefore = parseFloat(document.getElementById('damage-before')?.value) || 0;
        const damageAfter = parseFloat(document.getElementById('damage-after')?.value) || 0;
        
        if (damageBefore <= 0) {
            showNotification('请输入有效的提升前伤害值', 'warning');
            return;
        }
        
        // 伤害提升计算：(提升后伤害 - 提升前伤害) / 提升前伤害 * 100%
        const improvement = ((damageAfter - damageBefore) / damageBefore) * 100;
        
        // 显示结果
        const resultElement = document.getElementById('improvement-result');
        if (resultElement) {
            const color = improvement >= 0 ? '#4a9eff' : '#ff6b6b';
            const sign = improvement >= 0 ? '+' : '';
            resultElement.innerHTML = `伤害提升：${sign}${improvement.toFixed(2)}%`;
            resultElement.style.color = color;
            
            // 添加结果动画
            animateResultUpdate('improvement-result');
        }
        
        showNotification('伤害提升计算完成！', 'success');
        
    } catch (error) {
        console.error('伤害提升计算错误:', error);
        showNotification('伤害提升计算出错，请检查输入数据', 'error');
    }
}

// 麻痹计算函数
function calculateParalysis() {
    try {
        const layersInput = document.getElementById('paralysis-layers');
        const effectInput = document.getElementById('paralysis-effect');
        const conductiveCheckbox = document.getElementById('conductive');
        
        if (!layersInput || !effectInput || !conductiveCheckbox) {
            showNotification('找不到输入元素', 'error');
            return;
        }
        
        const layers = parseInt(layersInput.value) || 0;
        const effectPercent = parseFloat(effectInput.value) || 0;
        const isConductive = conductiveCheckbox.checked;
        
        if (layers <= 0) {
            showNotification('请输入有效的麻痹层数', 'warning');
            return;
        }
        
        // 麻痹基础效果：每层5%增伤，导电时每层11%增伤
        const baseEffectPerLayer = isConductive ? 11 : 5;
        
        // 计算总增伤：基础效果 × 层数 × (1 + 麻痹效果%)
        const totalIncrease = baseEffectPerLayer * layers * (1 + effectPercent / 100);
        
        // 显示结果
        const resultElement = document.getElementById('paralysis-result');
        const currentEffectElement = document.getElementById('current-paralysis-effect');
        
        if (resultElement) {
            resultElement.innerHTML = `麻痹总增伤：${totalIncrease.toFixed(2)}%`;
            resultElement.style.color = '#4a9eff';
            
            // 添加结果动画
            resultElement.style.transform = 'scale(1.1)';
            setTimeout(() => {
                resultElement.style.transform = 'scale(1)';
            }, 300);
        }
        
        if (currentEffectElement) {
            const currentEffect = baseEffectPerLayer * (1 + effectPercent / 100);
            currentEffectElement.innerHTML = `${currentEffect.toFixed(2)}%`;
        }
        
        showNotification('麻痹计算完成！', 'success');
        
    } catch (error) {
        console.error('麻痹计算错误:', error);
        showNotification('麻痹计算出错，请检查输入数据', 'error');
    }
}

// 贯注计算函数
function calculateFocus() {
    try {
        const focusTypeSelect = document.getElementById('focus-type');
        const speedIncInput = document.getElementById('focus-speed-inc');
        const speedMore1Input = document.getElementById('focus-speed-more1');
        const speedMore2Input = document.getElementById('focus-speed-more2');
        const movementSpeedInput = document.getElementById('movement-speed');
        const sharpPainCheckbox = document.getElementById('sharp-pain');
        const dullPainCheckbox = document.getElementById('dull-pain');
        
        if (!focusTypeSelect || !speedIncInput) {
            showNotification('找不到输入元素', 'error');
            return;
        }
        
        const focusType = focusTypeSelect.value;
        const speedInc = parseFloat(speedIncInput.value) || 0;
        const speedMore1 = parseFloat(speedMore1Input?.value) || 0;
        const speedMore2 = parseFloat(speedMore2Input?.value) || 0;
        const movementSpeed = parseFloat(movementSpeedInput?.value) || 0;
        const hasSharpPain = sharpPainCheckbox?.checked || false;
        const hasDullPain = dullPainCheckbox?.checked || false;
        
        if (!focusType) {
            showNotification('请选择贯注类型', 'warning');
            return;
        }
        
        // 计算贯注速度：基础速度 × (1 + inc%) × (1 + more1%) × (1 + more2%)
        let totalSpeedMultiplier = (1 + speedInc / 100) * (1 + speedMore1 / 100) * (1 + speedMore2 / 100);
        
        // 锐利贯注特殊处理：移动速度影响
        if (focusType === 'sharp' && movementSpeed > 0) {
            totalSpeedMultiplier *= (1 + movementSpeed / 100);
        }
        
        // 痛苦效果处理
        let painMultiplier = 1;
        if (hasSharpPain) painMultiplier *= 1.2; // 锐痛增加20%效果
        if (hasDullPain) painMultiplier *= 1.15; // 钝痛增加15%效果
        
        const finalSpeedMultiplier = totalSpeedMultiplier * painMultiplier;
        const speedImprovement = (finalSpeedMultiplier - 1) * 100;
        
        // 显示结果
        const resultElement = document.getElementById('focus-result');
        if (resultElement) {
            resultElement.innerHTML = `
                <div class="result-item">
                    <span class="label">贯注类型:</span>
                    <span class="value">${getFocusTypeName(focusType)}</span>
                </div>
                <div class="result-item">
                    <span class="label">贯注速度提升:</span>
                    <span class="value">${speedImprovement.toFixed(2)}%</span>
                </div>
                <div class="result-item">
                    <span class="label">最终速度倍率:</span>
                    <span class="value">${finalSpeedMultiplier.toFixed(3)}x</span>
                </div>
            `;
            
            // 添加结果动画
            resultElement.style.transform = 'scale(1.1)';
            setTimeout(() => {
                resultElement.style.transform = 'scale(1)';
            }, 300);
        }
        
        showNotification('贯注计算完成！', 'success');
        
    } catch (error) {
        console.error('贯注计算错误:', error);
        showNotification('贯注计算出错，请检查输入数据', 'error');
    }
}

// 更新贯注输入框显示
function updateFocusInputs() {
    const focusType = document.getElementById('focus-type')?.value;
    const movementSpeedGroup = document.getElementById('movement-speed-group');
    const painCheckboxGroup = document.getElementById('pain-checkbox-group');
    
    if (movementSpeedGroup) {
        movementSpeedGroup.style.display = focusType === 'sharp' ? 'block' : 'none';
    }
    
    if (painCheckboxGroup) {
        painCheckboxGroup.style.display = focusType ? 'block' : 'none';
    }
    
    calculateFocus();
}

// 获取贯注类型名称
function getFocusTypeName(focusType) {
    const names = {
        'sharp': '锐利贯注',
        'ice': '寒冰贯注',
        'thunder': '雷霆贯注',
        'erosion': '侵蚀贯注',
        'fire': '熔火贯注'
    };
    return names[focusType] || focusType;
}

// 梦境系统数据
const dreamData = {
    accessory: {
        name: '饰品',
        isAccessory: true,
        types: [
            { value: 'ring', name: '戒指' },
            { value: 'necklace', name: '项链' },
            { value: 'belt', name: '腰带' }
        ]
    },
    weapon: {
        name: '武器',
        isAccessory: false,
        types: [
            { value: 'claw', name: '爪' },
            { value: 'dagger', name: '匕首' },
            { value: 'one_hand_sword', name: '单手剑' },
            { value: 'one_hand_hammer', name: '单手锤' },
            { value: 'one_hand_axe', name: '单手斧' },
            { value: 'staff', name: '法杖' },
            { value: 'spirit_staff', name: '灵杖' },
            { value: 'magic_wand', name: '魔杖' },
            { value: 'hand_staff', name: '手杖' },
            { value: 'pistol', name: '手枪' },
            { value: 'two_hand_sword', name: '双手剑' },
            { value: 'two_hand_hammer', name: '双手锤' },
            { value: 'two_hand_axe', name: '双手斧' },
            { value: 'tin_staff', name: '锡杖' },
            { value: 'war_staff', name: '武杖' },
            { value: 'bow', name: '弓' },
            { value: 'crossbow', name: '弩' },
            { value: 'rifle', name: '火枪' },
            { value: 'cannon', name: '火炮' }
        ]
    }
};

// 饰品词缀数据
const accessoryAffixes = {
    ring: [
        { name: '+(20-30) 最大生命', weight: 30 },
        { name: '+(15-25) 最大魔力', weight: 30 },
        { name: '+(8-12)% 元素抗性', weight: 25 },
        { name: '+(5-8)% 攻击速度', weight: 20 },
        { name: '+(10-15)% 暴击伤害', weight: 15 },
        { name: '+(3-5)% 移动速度', weight: 10 }
    ],
    necklace: [
        { name: '+(40-60) 最大生命', weight: 30 },
        { name: '+(25-40) 最大魔力', weight: 30 },
        { name: '+(10-15)% 元素伤害', weight: 25 },
        { name: '+(8-12)% 暴击率', weight: 20 },
        { name: '+(15-25)% 暴击伤害', weight: 15 },
        { name: '+(5-8)% 技能范围', weight: 10 }
    ],
    belt: [
        { name: '+(30-50) 最大生命', weight: 30 },
        { name: '+(20-35) 最大魔力', weight: 30 },
        { name: '+(100-150) 护甲值', weight: 25 },
        { name: '+(5-8)% 移动速度', weight: 20 },
        { name: '+(10-15)% 药剂效果', weight: 15 },
        { name: '+(3-5)% 技能冷却恢复', weight: 10 }
    ]
};

// 武器词缀数据
// 从quanzhong.JSON加载真实词缀数据的函数
function loadRealAffixData() {
    if (!gameData.weights) {
        console.warn('权重数据未加载，无法更新词缀数据');
        return;
    }
    
    console.log('开始从quanzhong.JSON加载真实词缀数据...');
    
    // 装备类型映射：quanzhong.JSON中的名称 -> script.js中的键名
    const equipmentMapping = {
        // 饰品
        '戒指': 'ring',
        '项链': 'necklace', 
        '腰带': 'belt',
        // 武器
        '爪': 'claw',
        '匕首': 'dagger',
        '单手剑': 'one_hand_sword',
        '单手锤': 'one_hand_hammer',
        '单手斧': 'one_hand_axe',
        '法杖': 'staff',
        '灵杖': 'spirit_staff',
        '魔杖': 'magic_wand',
        '手杖': 'hand_staff',
        '手枪': 'pistol',
        '双手剑': 'two_hand_sword',
        '双手锤': 'two_hand_hammer',
        '双手斧': 'two_hand_axe',
        '锡杖': 'tin_staff',
        '武杖': 'war_staff',
        '弓': 'bow',
        '弩': 'crossbow',
        '火枪': 'rifle',
        '火炮': 'cannon'
    };
    
    // 清空现有数据
    Object.keys(weaponAffixes).forEach(key => {
        weaponAffixes[key] = [];
    });
    Object.keys(accessoryAffixes).forEach(key => {
        accessoryAffixes[key] = [];
    });
    
    // 遍历权重数据，更新词缀
    gameData.weights.forEach(item => {
        const equipmentType = item['装备类型'];
        const position = item['部位'];
        const affixList = item['词缀列表'];
        
        const mappedKey = equipmentMapping[equipmentType];
        if (!mappedKey) {
            console.warn(`未找到装备类型映射: ${equipmentType}`);
            return;
        }
        
        // 转换词缀格式
        const convertedAffixes = affixList.map(affix => ({
            name: affix['词缀'],
            weight: affix['权重']
        }));
        
        // 根据部位分配到对应的对象
        if (position === '饰品') {
            accessoryAffixes[mappedKey] = convertedAffixes;
        } else if (position === '武器') {
            weaponAffixes[mappedKey] = convertedAffixes;
        }
    });
    
    console.log('词缀数据加载完成');
    console.log('武器词缀数量:', Object.keys(weaponAffixes).length);
    console.log('饰品词缀数量:', Object.keys(accessoryAffixes).length);
}

const weaponAffixes = {
    // 单手武器
    claw: [
        { name: '+(15-25)% 物理伤害', weight: 30 },
        { name: '+(10-18)% 攻击速度', weight: 30 },
        { name: '+(8-12)% 暴击率', weight: 25 },
        { name: '附加 (5-10) - (15-25) 点物理伤害', weight: 20 },
        { name: '+(15-25)% 暴击伤害', weight: 15 },
        { name: '+(5-8)% 命中值', weight: 10 }
    ],
    dagger: [
        { name: '+(15-25)% 物理伤害', weight: 30 },
        { name: '+(10-18)% 攻击速度', weight: 30 },
        { name: '+(10-15)% 暴击率', weight: 25 },
        { name: '附加 (3-8) - (12-20) 点物理伤害', weight: 20 },
        { name: '+(20-30)% 暴击伤害', weight: 15 },
        { name: '+(3-6)% 移动速度', weight: 10 }
    ],
    one_hand_sword: [
        { name: '+(20-30)% 物理伤害', weight: 30 },
        { name: '+(8-15)% 攻击速度', weight: 30 },
        { name: '+(8-12)% 暴击率', weight: 25 },
        { name: '附加 (8-15) - (20-35) 点物理伤害', weight: 20 },
        { name: '+(15-25)% 暴击伤害', weight: 15 },
        { name: '+(100-150) 命中值', weight: 10 }
    ],
    one_hand_hammer: [
        { name: '+(25-35)% 物理伤害', weight: 30 },
        { name: '+(6-12)% 攻击速度', weight: 30 },
        { name: '+(6-10)% 暴击率', weight: 25 },
        { name: '附加 (10-20) - (25-40) 点物理伤害', weight: 20 },
        { name: '+(20-30)% 暴击伤害', weight: 15 },
        { name: '+(5-8)% 击晕几率', weight: 10 }
    ],
    one_hand_axe: [
        { name: '+(20-30)% 物理伤害', weight: 30 },
        { name: '+(8-15)% 攻击速度', weight: 30 },
        { name: '+(8-12)% 暴击率', weight: 25 },
        { name: '附加 (8-15) - (20-35) 点物理伤害', weight: 20 },
        { name: '+(15-25)% 暴击伤害', weight: 15 },
        { name: '+(3-6)% 流血几率', weight: 10 }
    ],
    staff: [
        { name: '+(20-30)% 元素伤害', weight: 30 },
        { name: '+(10-18)% 施法速度', weight: 30 },
        { name: '+(8-12)% 暴击率', weight: 25 },
        { name: '附加 (5-12) - (18-30) 点元素伤害', weight: 20 },
        { name: '+(15-25)% 暴击伤害', weight: 15 },
        { name: '+(20-35) 最大魔力', weight: 10 }
    ],
    spirit_staff: [
        { name: '+(20-30)% 元素伤害', weight: 30 },
        { name: '+(10-18)% 施法速度', weight: 30 },
        { name: '+(8-12)% 暴击率', weight: 25 },
        { name: '附加 (5-12) - (18-30) 点元素伤害', weight: 20 },
        { name: '+(15-25)% 暴击伤害', weight: 15 },
        { name: '+(3-6)% 魔力回复速度', weight: 10 }
    ],
    magic_wand: [
        { name: '+(15-25)% 元素伤害', weight: 30 },
        { name: '+(12-20)% 施法速度', weight: 30 },
        { name: '+(10-15)% 暴击率', weight: 25 },
        { name: '附加 (3-8) - (12-20) 点元素伤害', weight: 20 },
        { name: '+(20-30)% 暴击伤害', weight: 15 },
        { name: '+(15-25) 最大魔力', weight: 10 }
    ],
    hand_staff: [
        { name: '+(18-28)% 元素伤害', weight: 30 },
        { name: '+(10-16)% 施法速度', weight: 30 },
        { name: '+(8-12)% 暴击率', weight: 25 },
        { name: '附加 (4-10) - (15-25) 点元素伤害', weight: 20 },
        { name: '+(15-25)% 暴击伤害', weight: 15 },
        { name: '+(20-30) 最大魔力', weight: 10 }
    ],
    pistol: [
        { name: '+(20-30)% 物理伤害', weight: 30 },
        { name: '+(8-15)% 攻击速度', weight: 30 },
        { name: '+(10-15)% 暴击率', weight: 25 },
        { name: '附加 (6-12) - (18-30) 点物理伤害', weight: 20 },
        { name: '+(20-30)% 暴击伤害', weight: 15 },
        { name: '+(100-150) 命中值', weight: 10 }
    ],
    // 双手武器
    two_hand_sword: [
        { name: '+(30-45)% 物理伤害', weight: 30 },
        { name: '+(6-12)% 攻击速度', weight: 30 },
        { name: '+(8-12)% 暴击率', weight: 25 },
        { name: '附加 (15-30) - (35-60) 点物理伤害', weight: 20 },
        { name: '+(20-35)% 暴击伤害', weight: 15 },
        { name: '+(150-250) 命中值', weight: 10 }
    ],
    two_hand_hammer: [
        { name: '+(35-50)% 物理伤害', weight: 30 },
        { name: '+(4-10)% 攻击速度', weight: 30 },
        { name: '+(6-10)% 暴击率', weight: 25 },
        { name: '附加 (20-40) - (45-75) 点物理伤害', weight: 20 },
        { name: '+(25-40)% 暴击伤害', weight: 15 },
        { name: '+(8-15)% 击晕几率', weight: 10 }
    ],
    two_hand_axe: [
        { name: '+(30-45)% 物理伤害', weight: 30 },
        { name: '+(6-12)% 攻击速度', weight: 30 },
        { name: '+(8-12)% 暴击率', weight: 25 },
        { name: '附加 (15-30) - (35-60) 点物理伤害', weight: 20 },
        { name: '+(20-35)% 暴击伤害', weight: 15 },
        { name: '+(5-10)% 流血几率', weight: 10 }
    ],
    tin_staff: [
        { name: '+(30-45)% 元素伤害', weight: 30 },
        { name: '+(8-15)% 施法速度', weight: 30 },
        { name: '+(8-12)% 暴击率', weight: 25 },
        { name: '附加 (10-20) - (30-50) 点元素伤害', weight: 20 },
        { name: '+(20-35)% 暴击伤害', weight: 15 },
        { name: '+(40-60) 最大魔力', weight: 10 }
    ],
    war_staff: [
        { name: '+(30-45)% 元素伤害', weight: 30 },
        { name: '+(8-15)% 施法速度', weight: 30 },
        { name: '+(8-12)% 暴击率', weight: 25 },
        { name: '附加 (10-20) - (30-50) 点元素伤害', weight: 20 },
        { name: '+(20-35)% 暴击伤害', weight: 15 },
        { name: '+(5-8)% 技能范围', weight: 10 }
    ],
    bow: [
        { name: '+(25-40)% 物理伤害', weight: 30 },
        { name: '+(8-15)% 攻击速度', weight: 30 },
        { name: '+(10-15)% 暴击率', weight: 25 },
        { name: '附加 (8-18) - (25-45) 点物理伤害', weight: 20 },
        { name: '+(25-40)% 暴击伤害', weight: 15 },
        { name: '+(150-250) 命中值', weight: 10 }
    ],
    crossbow: [
        { name: '+(30-45)% 物理伤害', weight: 30 },
        { name: '+(6-12)% 攻击速度', weight: 30 },
        { name: '+(12-18)% 暴击率', weight: 25 },
        { name: '附加 (12-25) - (30-55) 点物理伤害', weight: 20 },
        { name: '+(30-45)% 暴击伤害', weight: 15 },
        { name: '+(200-300) 命中值', weight: 10 }
    ],
    rifle: [
        { name: '+(25-40)% 物理伤害', weight: 30 },
        { name: '+(8-15)% 攻击速度', weight: 30 },
        { name: '+(10-15)% 暴击率', weight: 25 },
        { name: '附加 (10-20) - (28-48) 点物理伤害', weight: 20 },
        { name: '+(25-40)% 暴击伤害', weight: 15 },
        { name: '+(150-250) 命中值', weight: 10 }
    ],
    cannon: [
        { name: '+(35-50)% 物理伤害', weight: 30 },
        { name: '+(4-10)% 攻击速度', weight: 30 },
        { name: '+(8-12)% 暴击率', weight: 25 },
        { name: '附加 (20-40) - (50-80) 点物理伤害', weight: 20 },
        { name: '+(30-45)% 暴击伤害', weight: 15 },
        { name: '+(8-15)% 范围伤害', weight: 10 }
    ]
};

// 初始化梦境系统
async function initializeDreamSystem() {
    console.log('初始化解梦系统...');
    
    try {
        // 等待权重数据加载完成
        if (!gameData.weights) {
            console.log('等待权重数据加载...');
            await new Promise(resolve => {
                const checkData = () => {
                    if (gameData.weights) {
                        resolve();
                    } else {
                        setTimeout(checkData, 100);
                    }
                };
                checkData();
            });
        }
        
        // 从quanzhong.JSON加载真实词缀数据
        loadRealAffixData();
        
        // 加载词缀数据
        await loadAffixData();
        console.log('解梦系统词缀数据加载完成');
    } catch (error) {
        console.error('解梦系统词缀数据加载失败:', error);
    }
    
    // 调试信息：检查数据结构
    console.log('dreamData:', dreamData);
    console.log('weaponAffixes keys:', Object.keys(weaponAffixes));
    console.log('accessoryAffixes keys:', Object.keys(accessoryAffixes));
    console.log('weaponAffixes sample:', weaponAffixes.one_hand_sword);
    console.log('accessoryAffixes sample:', accessoryAffixes.ring);
    
    const dreamPositionSelect = document.getElementById('dream-position');
    const dreamTypeSelect = document.getElementById('dream-type');
    const dreamAffixSelect = document.getElementById('dream-affix');
    
    if (!dreamPositionSelect || !dreamTypeSelect || !dreamAffixSelect) {
        console.warn('解梦系统初始化失败：找不到必要的DOM元素');
        return;
    }
    
    // 装备部位变化时更新装备类型
    dreamPositionSelect.addEventListener('change', function() {
        console.log('装备位置变化:', this.value);
        const selectedPosition = this.value;
        const positionData = dreamData[selectedPosition];
        
        // 清空并重新填充装备类型选择器
        dreamTypeSelect.innerHTML = '<option value="">请选择装备类型</option>';
        dreamTypeSelect.disabled = !selectedPosition;
        
        if (positionData && positionData.types) {
            positionData.types.forEach(type => {
                const option = document.createElement('option');
                option.value = type.value;
                option.textContent = type.name;
                dreamTypeSelect.appendChild(option);
            });
        }
        
        // 清空词缀选择器
        dreamAffixSelect.innerHTML = '<option value="">请先选择装备类型</option>';
        dreamAffixSelect.disabled = true;
        
        // 重新计算
        calculateDreamCost();
    });
    
    // 装备类型变化时更新词缀
    dreamTypeSelect.addEventListener('change', function() {
        console.log('装备类型变化:', this.value);
        const selectedPosition = dreamPositionSelect.value;
        const selectedType = this.value;
        
        // 清空并重新填充词缀选择器
        dreamAffixSelect.innerHTML = '<option value="">请选择需求词缀</option>';
        dreamAffixSelect.disabled = !selectedType;
        
        if (selectedPosition && selectedType) {
            updateDreamAffixes(selectedPosition, selectedType);
        }
        
        // 重新计算
        calculateDreamCost();
    });
    
    // 添加计算事件监听
    const dreamInputs = ['dream-position', 'dream-type', 'dream-level', 'dream-affix', 'dream-weapon-price', 'dream-accessory-price'];
    dreamInputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', calculateDreamCost);
            element.addEventListener('input', calculateDreamCost);
        }
    });
}

// 填充装备类型选择器
function populateDreamEquipmentTypes() {
    const equipmentTypeSelect = document.getElementById('equipment-type');
    if (!equipmentTypeSelect) return;
    
    equipmentTypeSelect.innerHTML = '<option value="">请选择装备类型</option>';
    
    Object.keys(dreamData).forEach(key => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = dreamData[key].name;
        equipmentTypeSelect.appendChild(option);
    });
}

function updateDreamAffixes(selectedPosition, selectedType) {
    console.log('更新词缀选择器:', selectedPosition, selectedType);
    
    const dreamAffixSelect = document.getElementById('dream-affix');
    if (!dreamAffixSelect || !selectedPosition || !selectedType) {
        if (dreamAffixSelect) {
            dreamAffixSelect.innerHTML = '<option value="">请先选择装备类型</option>';
            dreamAffixSelect.disabled = true;
        }
        return;
    }
    
    // 获取对应的词缀数据
    let affixes = [];
    
    console.log('查找词缀数据 - 位置:', selectedPosition, '类型:', selectedType);
    
    // 直接使用硬编码的词缀数据
    if (selectedPosition === 'weapon' && weaponAffixes && weaponAffixes[selectedType]) {
        affixes = weaponAffixes[selectedType];
        console.log('找到武器词缀:', affixes.length, '个');
    } else if (selectedPosition === 'accessory' && accessoryAffixes && accessoryAffixes[selectedType]) {
        affixes = accessoryAffixes[selectedType];
        console.log('找到饰品词缀:', affixes.length, '个');
    }
    
    // 如果仍然没有找到词缀数据，使用默认词缀
    if (!affixes || affixes.length === 0) {
        console.log('未找到对应词缀数据，使用默认词缀');
        const defaultAffixes = selectedPosition === 'weapon' ? [
            { name: '增加物理伤害', weight: 30 },
            { name: '增加元素伤害', weight: 30 },
            { name: '增加攻击速度', weight: 30 },
            { name: '增加暴击率', weight: 20 },
            { name: '增加暴击伤害', weight: 20 },
            { name: '增加命中值', weight: 15 },
            { name: '附加元素伤害', weight: 25 }
        ] : [
            { name: '增加生命值', weight: 30 },
            { name: '增加护甲值', weight: 25 },
            { name: '增加能量护盾', weight: 25 },
            { name: '增加元素抗性', weight: 20 },
            { name: '增加移动速度', weight: 15 },
            { name: '增加法力值', weight: 20 },
            { name: '增加法力回复', weight: 15 }
        ];
        affixes = defaultAffixes;
    }
    
    // 清空并重新填充词缀选择器
    dreamAffixSelect.innerHTML = '<option value="">请选择需求词缀</option>';
    
    affixes.forEach((affix, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = affix.name || affix;
        dreamAffixSelect.appendChild(option);
    });
    
    dreamAffixSelect.disabled = false;
}

// 梦境成本计算
function calculateDreamCost() {
    try {
        const dreamPosition = document.getElementById('dream-position')?.value;
        const dreamType = document.getElementById('dream-type')?.value;
        const dreamLevel = parseInt(document.getElementById('dream-level')?.value);
        const selectedAffixIndex = parseInt(document.getElementById('dream-affix')?.value);
        
        // 获取材料价格
        const weaponPrice = parseFloat(document.getElementById('dream-weapon-price')?.value) || 0;
        const accessoryPrice = parseFloat(document.getElementById('dream-accessory-price')?.value) || 0;
        
        const resultContainer = document.getElementById('dream-result');
        
        if (!dreamPosition || !dreamType) {
            if (resultContainer) {
                resultContainer.innerHTML = '<p class="error">请选择装备部位和类型</p>';
            }
            return;
        }
        
        if (!selectedAffixIndex && selectedAffixIndex !== 0) {
            if (resultContainer) {
                resultContainer.innerHTML = '<p class="error">请选择需求词缀</p>';
            }
            return;
        }
        
        // 根据装备部位确定材料价格
        const materialPrice = dreamPosition === 'weapon' ? weaponPrice : accessoryPrice;
        if (materialPrice <= 0) {
            if (resultContainer) {
                resultContainer.innerHTML = '<p class="error">请输入对应材料价格</p>';
            }
            return;
        }
        
        // 获取词缀数据 - 优先使用quanzhong.JSON，回退到硬编码数据
        let affixes = [];
        let selectedAffix = null;
        
        // 尝试从quanzhong.JSON获取词缀数据
        if (affixData && Array.isArray(affixData)) {
            let targetEquipmentType = '';
            if (dreamPosition === 'weapon') {
                const weaponTypeMap = {
                    'claw': '爪',
                    'dagger': '匕首',
                    'one_hand_sword': '单手剑',
                    'one_hand_hammer': '单手锤',
                    'one_hand_axe': '单手斧',
                    'staff': '法杖',
                    'spirit_staff': '灵杖',
                    'magic_wand': '魔杖',
                    'hand_staff': '手杖',
                    'pistol': '手枪',
                    'two_hand_sword': '双手剑',
                    'two_hand_hammer': '双手锤',
                    'two_hand_axe': '双手斧',
                    'tin_staff': '锡杖',
                    'war_staff': '武杖',
                    'bow': '弓',
                    'crossbow': '弩',
                    'rifle': '火枪',
                    'cannon': '火炮'
                };
                targetEquipmentType = weaponTypeMap[dreamType] || dreamType;
            } else if (dreamPosition === 'accessory') {
                const accessoryTypeMap = {
                    'ring': '戒指',
                    'necklace': '项链',
                    'belt': '腰带'
                };
                targetEquipmentType = accessoryTypeMap[dreamType] || dreamType;
            }
            
            const equipmentData = affixData.find(item => item.装备类型 === targetEquipmentType);
            if (equipmentData && equipmentData.词缀列表) {
                // 转换为原始格式
                affixes = equipmentData.词缀列表
                    .filter(affix => affix.权重 && affix.权重 > 0)
                    .map(affix => ({
                        name: affix.词缀,
                        weight: affix.权重
                    }));
            }
        }
        
        // 如果quanzhong.JSON没有数据，使用硬编码数据
        if (affixes.length === 0) {
            if (dreamPosition === 'weapon' && weaponAffixes[dreamType]) {
                affixes = weaponAffixes[dreamType];
            } else if (dreamPosition === 'accessory' && accessoryAffixes[dreamType]) {
                affixes = accessoryAffixes[dreamType];
            }
        }
        
        if (!affixes[selectedAffixIndex]) {
            if (resultContainer) {
                resultContainer.innerHTML = '<p class="error">词缀数据错误</p>';
            }
            return;
        }
        
        selectedAffix = affixes[selectedAffixIndex];
        
        // 计算总权重
        const totalWeight = affixes.reduce((sum, affix) => sum + affix.weight, 0);
        
        // 确定材料价格和消耗数量
        const isAccessory = dreamData[dreamPosition].isAccessory;
        const finalMaterialPrice = isAccessory ? accessoryPrice : weaponPrice;
        const materialName = isAccessory ? '梦语-饰品' : '梦语-武器';
        
        if (finalMaterialPrice <= 0) {
            if (resultContainer) {
                resultContainer.innerHTML = `<p class="error">请输入有效的${materialName}价格</p>`;
            }
            return;
        }
        
        // 根据等级确定消耗数量
        let materialCount;
        switch (dreamLevel) {
            case 82:
                materialCount = 1;
                break;
            case 86:
                materialCount = 2;
                break;
            case 100:
                materialCount = 3;
                break;
            default:
                materialCount = 1;
        }
        
        // 计算解梦成本 - 修正为解梦机制（从3个选项中选择1个）
        // 解梦机制：每次解梦会随机生成3个词缀选项，玩家从中选择1个
        // 获得目标词缀的概率 = 1 - (1 - 单次概率)^3
        // 成本 = 材料成本 / 获得概率
        const singleProbability = selectedAffix.weight / totalWeight;
        const dreamProbability = 1 - Math.pow(1 - singleProbability, 3);
        const totalCost = (finalMaterialPrice * materialCount) / dreamProbability;
        
        // 显示结果 - 仅显示最终概率
        if (resultContainer) {
            resultContainer.innerHTML = `
                <div style="font-size: 1.2em; font-weight: bold; margin-bottom: 0.5rem;">
                    解梦成本：${totalCost.toFixed(2)} 初火源质
                </div>
                <div style="font-size: 0.9em; color: rgba(255,255,255,0.8); line-height: 1.4;">
                    解梦成功率：${(dreamProbability * 100).toFixed(2)}%
                </div>
            `;
        }
        
        showNotification('解梦成本计算完成！', 'success');
        
        // 保存材料价格
        const materials = {
            lingsha: parseFloat(document.getElementById('lingsha-price')?.value) || 0,
            zhengui: parseFloat(document.getElementById('zhengui-price')?.value) || 0,
            xishi: parseFloat(document.getElementById('xishi-price')?.value) || 0,
            zhizhen: parseFloat(document.getElementById('zhizhen-price')?.value) || 0,
            shensheng: parseFloat(document.getElementById('shensheng-price')?.value) || 0,
            dreamWeapon: parseFloat(document.getElementById('dream-weapon-price')?.value) || 0,
            dreamAccessory: parseFloat(document.getElementById('dream-accessory-price')?.value) || 0
        };
        saveMaterialPrices(materials);
        
    } catch (error) {
        console.error('解梦成本计算错误:', error);
        showNotification('解梦成本计算出错，请检查输入数据', 'error');
    }
}

// 初始化封印系统
function initializeSealSystem() {
    try {
        // 检查封印系统的关键DOM元素是否存在
        const sealSystemContainer = document.getElementById('seal');
        if (!sealSystemContainer) {
            console.log('封印系统容器未找到，跳过初始化');
            return;
        }
        
        // 设置光环标签页
        setupSealHaloTabs();
        
        // 初始化技能数据
        populateSealSkills();
        
        // 设置封印类型变化监听器
        setupSealTypeListeners();
        
        // 设置输入事件监听器
        setupSealInputListeners();
        
        console.log('封印系统初始化完成');
    } catch (error) {
        console.error('封印系统初始化失败:', error);
    }
}

// 设置封印类型变化监听器（动态显示封印转化选项）
function setupSealTypeListeners() {
    for (let halo = 1; halo <= 4; halo++) {
        const sealTypeSelect = document.getElementById(`seal-type-${halo}`);
        const conversionGroup = document.getElementById(`conversion-group-${halo}`);
        
        if (sealTypeSelect && conversionGroup) {
            sealTypeSelect.addEventListener('change', function() {
                if (this.value === 'life') {
                    conversionGroup.style.display = 'block';
                } else {
                    conversionGroup.style.display = 'none';
                }
                // 触发重新计算
                calculateSealSystem();
            });
            
            // 初始化显示状态
            if (sealTypeSelect.value === 'life') {
                conversionGroup.style.display = 'block';
            } else {
                conversionGroup.style.display = 'none';
            }
        } else {
            console.log(`封印系统元素未找到: seal-type-${halo} 或 conversion-group-${halo}`);
        }
    }
}

// 设置输入事件监听器
function setupSealInputListeners() {
    // 全局参数监听器
    const globalInputs = ['equipment-seal-compensation', 'other-seal-compensation'];
    globalInputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', calculateSealSystem);
            element.addEventListener('change', calculateSealSystem);
        }
    });
    
    // 每个光环的输入监听器
    for (let halo = 1; halo <= 4; halo++) {
        // 基础参数
        const haloInputs = [
            `base-seal-${halo}`,
            `seal-type-${halo}`,
            `pathfinder-slots-${halo}`,
            `conversion-skill-${halo}`,
            `conversion-level-${halo}`
        ];
        
        haloInputs.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', calculateSealSystem);
                element.addEventListener('change', calculateSealSystem);
            }
        });
        
        // 辅助技能监听器
        for (let skill = 1; skill <= 4; skill++) {
            const skillSelect = document.getElementById(`support-skill-${halo}-${skill}`);
            const skillLevel = document.getElementById(`support-level-${halo}-${skill}`);
            
            if (skillSelect) {
                skillSelect.addEventListener('change', calculateSealSystem);
            }
            if (skillLevel) {
                skillLevel.addEventListener('input', calculateSealSystem);
                skillLevel.addEventListener('change', calculateSealSystem);
            }
        }
    }
}

// 填充技能选择器
function populateSealSkills() {
    // 检查gameData.supportGems是否已加载
    if (!gameData.supportGems) {
        console.error('辅助宝石数据未加载');
        return;
    }
    
    // 从gameData.supportGems获取真实的技能数据
    let availableSkills = [];
    let sealConversionSkills = [];
    
    try {
        const supportGemsData = gameData.supportGems;
        
        // 处理fixed_skills
        if (supportGemsData.fixed_skills) {
            for (const skillName in supportGemsData.fixed_skills) {
                const skillData = supportGemsData.fixed_skills[skillName];
                const skill = {
                    id: skillName,
                    name: skillName,
                    type: '固定技能',
                    compensation: skillData.compensation || 0,
                    multiplier: skillData.multiplier || 100
                };
                availableSkills.push(skill);
                
                // 如果是封印转化相关技能，也添加到封印转化技能列表
                if (skillName.includes('封印转化')) {
                    sealConversionSkills.push(skill);
                }
            }
        }
        
        // 处理leveled_skills
        if (supportGemsData.leveled_skills) {
            for (const skillName in supportGemsData.leveled_skills) {
                const skillData = supportGemsData.leveled_skills[skillName];
                const skill = {
                    id: skillName,
                    name: skillName,
                    type: '等级技能',
                    multiplier: skillData.multiplier || 100,
                    hasLevels: true,
                    compensationByLevel: skillData.compensation_by_level || {}
                };
                availableSkills.push(skill);
                
                // 如果是封印转化相关技能，也添加到封印转化技能列表
                if (skillName.includes('封印转化')) {
                    sealConversionSkills.push(skill);
                }
            }
        }
        
        console.log('可用技能数量:', availableSkills.length);
        console.log('封印转化技能数量:', sealConversionSkills.length);
        
    } catch (error) {
        console.error('处理技能数据时出错:', error);
        availableSkills = [];
        sealConversionSkills = [];
    }
    
    if (availableSkills.length === 0) {
        console.warn('没有找到可用的技能数据');
        return;
    }
    
    // 填充所有辅助技能选择器 (support-skill-X-Y)
    for (let halo = 1; halo <= 4; halo++) {
        for (let skill = 1; skill <= 4; skill++) {
            const selectId = `support-skill-${halo}-${skill}`;
            const skillSelect = document.getElementById(selectId);
            if (skillSelect) {
                populateSkillSelect(skillSelect, availableSkills);
            }
        }
    }
    
    // 填充所有封印转化技能选择器 (seal-conversion-X)
    for (let halo = 1; halo <= 4; halo++) {
        const selectId = `seal-conversion-${halo}`;
        const conversionSelect = document.getElementById(selectId);
        if (conversionSelect) {
            populateSkillSelect(conversionSelect, sealConversionSkills);
        }
    }
    
    console.log('所有技能选择器填充完成');
}

// 辅助函数：填充单个技能选择器
function populateSkillSelect(selectElement, skills) {
    // 清空选择器
    selectElement.innerHTML = '<option value="">请选择技能</option>';
    
    // 按类型分组技能
    const fixedSkills = skills.filter(skill => skill.type === '固定技能');
    const leveledSkills = skills.filter(skill => skill.type === '等级技能');
    
    // 添加固定技能
    if (fixedSkills.length > 0) {
        const fixedGroup = document.createElement('optgroup');
        fixedGroup.label = '固定技能';
        fixedSkills.forEach(skill => {
            const option = document.createElement('option');
            option.value = skill.id;
            option.textContent = `${skill.name} (${skill.compensation}%)`;
            option.dataset.type = skill.type;
            option.dataset.compensation = skill.compensation;
            option.dataset.multiplier = skill.multiplier;
            fixedGroup.appendChild(option);
        });
        selectElement.appendChild(fixedGroup);
    }
    
    // 添加等级技能
    if (leveledSkills.length > 0) {
        const leveledGroup = document.createElement('optgroup');
        leveledGroup.label = '等级技能';
        leveledSkills.forEach(skill => {
            const option = document.createElement('option');
            option.value = skill.id;
            option.textContent = `${skill.name} (等级相关)`;
            option.dataset.type = skill.type;
            option.dataset.hasLevels = 'true';
            option.dataset.multiplier = skill.multiplier;
            // 存储等级补偿数据
            option.dataset.compensationByLevel = JSON.stringify(skill.compensationByLevel);
            leveledGroup.appendChild(option);
        });
        selectElement.appendChild(leveledGroup);
    }
}

// 设置封印光环标签页
function setupSealHaloTabs() {
    const tabs = document.querySelectorAll('.seal-halo-tab');
    const panels = document.querySelectorAll('.seal-halo-panel');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const haloNumber = this.dataset.halo;
            
            // 移除所有活动状态
            tabs.forEach(t => t.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));
            
            // 添加当前活动状态
            this.classList.add('active');
            const targetPanel = document.getElementById(`seal-halo-${haloNumber}`);
            if (targetPanel) {
                targetPanel.classList.add('active');
            }
        });
    });
}

// 获取辅助技能的魔力封印补偿
function getSupportSkillCompensation(skillName, level) {
    if (!gameData.supportGems) {
        return 0;
    }
    
    // 检查固定技能
    if (gameData.supportGems.fixed_skills && gameData.supportGems.fixed_skills[skillName]) {
        return gameData.supportGems.fixed_skills[skillName].compensation || 0;
    }
    
    // 检查等级相关技能
    if (gameData.supportGems.leveled_skills && gameData.supportGems.leveled_skills[skillName]) {
        const skillData = gameData.supportGems.leveled_skills[skillName];
        if (skillData.compensation_by_level && skillData.compensation_by_level[level]) {
            return skillData.compensation_by_level[level];
        }
    }
    
    return 0;
}

// 计算单个光环的封印量
function calculateSingleHaloSeal(haloNumber) {
    try {
        // 获取基础参数
        const baseSeal = parseFloat(document.getElementById(`base-seal-${haloNumber}`)?.value) || 0;
        const sealType = document.getElementById(`seal-type-${haloNumber}`)?.value || 'mana';
        const sealLevel = parseInt(document.getElementById(`seal-level-${haloNumber}`)?.value) || 20;
        const pathSlots = parseInt(document.getElementById(`path-slots-${haloNumber}`)?.value) || 0;
        
        // 获取全局补偿
        const equipmentCompensation = parseFloat(document.getElementById('equipment-compensation')?.value) || 0;
        const otherCompensation = parseFloat(document.getElementById('other-compensation')?.value) || 0;
        
        // 计算辅助技能补偿
        let supportSkillsCompensation = 0;
        for (let i = 1; i <= 4; i++) {
            const skillSelect = document.getElementById(`support-skill-${haloNumber}-${i}`);
            const skillLevel = parseInt(document.getElementById(`support-level-${haloNumber}-${i}`)?.value) || 20;
            
            if (skillSelect && skillSelect.value) {
                const compensation = getSupportSkillCompensation(skillSelect.value, skillLevel);
                supportSkillsCompensation += compensation;
            }
        }
        
        // 计算总封印补偿
        const totalCompensation = (equipmentCompensation + otherCompensation + supportSkillsCompensation) / 100;
        
        // 计算独辟蹊径减少
        const pathReduction = Math.pow(0.95, pathSlots);
        
        // 基础封印量计算
        let sealAmount = (baseSeal / (1 + totalCompensation)) * pathReduction;
        
        // 如果是生命封印，需要额外的封印转化计算
        if (sealType === 'life') {
            const conversionSkillSelect = document.getElementById(`conversion-skill-${haloNumber}`);
            const conversionLevel = parseInt(document.getElementById(`conversion-level-${haloNumber}`)?.value) || 20;
            
            if (conversionSkillSelect && conversionSkillSelect.value) {
                const conversionCompensation = getSupportSkillCompensation(conversionSkillSelect.value, conversionLevel);
                // 封印转化补偿是负数，所以需要转换为正数用于除法
                const conversionDivisor = 1 + Math.abs(conversionCompensation) / 100;
                sealAmount = sealAmount / conversionDivisor;
            }
        }
        
        return {
            amount: sealAmount,
            type: sealType,
            haloNumber: haloNumber
        };
        
    } catch (error) {
        console.error(`计算光环${haloNumber}封印量时出错:`, error);
        return { amount: 0, type: 'mana', haloNumber: haloNumber };
    }
}

// 更新单个光环的计算结果显示
function updateHaloResult(haloNumber, result) {
    const resultElement = document.getElementById(`halo-${haloNumber}-result`);
    if (resultElement) {
        const sealTypeText = result.type === 'mana' ? '魔力封印' : '生命封印';
        resultElement.innerHTML = `
            <div class="halo-result">
                <span class="result-label">${sealTypeText}:</span>
                <span class="result-value">${result.amount.toFixed(2)}%</span>
            </div>
        `;
    }
}

// 封印系统总计算
function calculateSealSystem() {
    try {
        let totalManaSeal = 0;
        let totalLifeSeal = 0;
        
        // 计算每个光环的封印量
        for (let halo = 1; halo <= 4; halo++) {
            const result = calculateSingleHaloSeal(halo);
            updateHaloResult(halo, result);
            
            if (result.type === 'mana') {
                totalManaSeal += result.amount;
            } else if (result.type === 'life') {
                totalLifeSeal += result.amount;
            }
        }
        
        // 更新总结果显示
        const totalManaElement = document.getElementById('total-mana-seal');
        const totalLifeElement = document.getElementById('total-life-seal');
        
        if (totalManaElement) {
            totalManaElement.textContent = `${totalManaSeal.toFixed(2)}%`;
        }
        
        if (totalLifeElement) {
            totalLifeElement.textContent = `${totalLifeSeal.toFixed(2)}%`;
        }
        
        showNotification('封印系统计算完成', 'success');
        
    } catch (error) {
        console.error('封印系统计算错误:', error);
        showNotification('封印系统计算出错，请检查输入数据', 'error');
    }
}

// 调节数量函数（用于等级调节）
function adjustQuantity(inputId, change) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    let currentValue = parseInt(input.value) || 0;
    let newValue = currentValue + change;
    
    // 设置最小值和最大值限制
    const min = parseInt(input.min) || 0;
    const max = parseInt(input.max) || 40;
    
    newValue = Math.max(min, Math.min(max, newValue));
    
    input.value = newValue;
    
    // 触发input事件以更新计算
    input.dispatchEvent(new Event('input', { bubbles: true }));
}

// 高塔系统数据
const towerSystemData = {
    components: {
        '基础': { basePrice: 100 },
        '进阶': { basePrice: 200 },
        '高级': { basePrice: 500 }
    },
    patterns: {
        '简单': {
            'no_repeat': 1.0,
            'one_double': 0.5,
            'one_triple': 0.33
        },
        '普通': {
            'no_repeat': 2.0,
            'one_double': 1.0,
            'two_double': 3.0,
            'one_triple': 1.5
        },
        '复杂': {
            'no_repeat': 3.5,
            'one_double': 1.5,
            'two_double': 4.5,
            'one_triple': 2.0,
            'one_quadruple': 0.25
        },
        '深度': {
            'no_repeat': 5.19,
            'one_double': 1.8,
            'two_double': 6.0,
            'one_triple': 2.0,
            'one_quadruple': 0.50
        }
    }
};

// 初始化高塔系统
function initializeTowerSystem() {
    setupTowerEventListeners();
    updateTowerMaterialsDisplay();
    populateTowerWeaponTypes();
    // 初始化时根据研发类型调整序列输入规则
    updateSequenceInputValidation();
}

// 填充武器类型选择器
function populateTowerWeaponTypes() {
    const weaponSelect = document.getElementById('weapon-type');
    if (!weaponSelect) return;
    
    // 武器类型已经在HTML中预定义，无需动态填充
    console.log('高塔系统武器类型选择器已就绪');
}

// 设置高塔事件监听器
function setupTowerEventListeners() {
    // 武器类型选择监听
    const weaponSelect = document.getElementById('weapon-type');
    if (weaponSelect) {
        weaponSelect.addEventListener('change', function() {
            updateTowerMaterialsDisplay();
            calculateTowerResearch();
        });
    }
    
    // 武器等级选择监听
    const weaponLevel = document.getElementById('weapon-level');
    if (weaponLevel) {
        weaponLevel.addEventListener('change', function() {
            updateTowerMaterialsDisplay();
            calculateTowerResearch();
        });
    }
    
    // 武器类别选择监听
    const weaponCategory = document.getElementById('weapon-category');
    if (weaponCategory) {
        weaponCategory.addEventListener('change', function() {
            updateTowerMaterialsDisplay();
            calculateTowerResearch();
        });
    }
    
    // 研发类型选择监听
    const researchTypeSelect = document.getElementById('research-type');
    if (researchTypeSelect) {
        researchTypeSelect.addEventListener('change', function() {
            updateTowerMaterialsDisplay();
            updateSequenceInputValidation();
            calculateTowerResearch();
        });
    }
    
    // 材料价格输入监听
    ['basic-component-price', 'caster-component-price', 'guard-component-price', 'sniper-component-price', 'defense-component-price'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', () => {
                updateTowerMaterialsDisplay();
                calculateTowerResearch();
            });
            element.addEventListener('change', () => {
                updateTowerMaterialsDisplay();
                calculateTowerResearch();
            });
        }
    });
    
    // 目标序列输入监听
    const sequenceInput = document.getElementById('target-sequence');
    if (sequenceInput) {
        sequenceInput.addEventListener('input', function(event) {
            validateSequenceInput(event);
            updateSequenceInputValidation();
            calculateTowerResearch();
        });
    }
}

// 更新高塔材料显示
function updateTowerMaterialsDisplay() {
    const materialsDisplay = document.getElementById('materials-display');
    if (!materialsDisplay) return;
    
    const weaponType = document.getElementById('weapon-type')?.value;
    const weaponLevel = document.getElementById('weapon-level')?.value;
    const weaponCategory = document.getElementById('weapon-category')?.value;
    const researchType = document.getElementById('research-type')?.value;
    
    // 如果没有选择完整的武器信息或研发类型，显示提示信息
    if (!weaponType || !weaponLevel || !weaponCategory || !researchType) {
        materialsDisplay.innerHTML = `
            <div class="materials-placeholder">
                <i class="fas fa-info-circle"></i>
                <span>请先选择完整的武器信息和研发类型</span>
            </div>
        `;
        return;
    }
    
    try {
        // 尝试从gameData.towerSequence获取数据
        let towerData = null;
        if (gameData.towerSequence) {
            towerData = gameData.towerSequence;
        }
        
        // 如果没有加载到数据，使用默认配置
        if (!towerData) {
            console.warn('高塔序列数据未加载，使用默认配置');
            towerData = getDefaultTowerData();
        }
        
        // 获取材料需求
        const materials = calculateRequiredMaterials(weaponType, weaponLevel, weaponCategory, researchType, towerData);
        
        // 显示材料需求
        displayMaterialRequirements(materials, materialsDisplay);
        
    } catch (error) {
        console.error('更新高塔材料显示时出错:', error);
        materialsDisplay.innerHTML = `
            <div class="materials-error">
                <i class="fas fa-exclamation-triangle"></i>
                <span>材料数据加载失败，请刷新页面重试</span>
            </div>
        `;
    }
}

function getDefaultTowerData() {
    return {
        "研发规则": {
            "研发流程": {
                "基础研发": {
                    "消耗资源": {
                        "基础元件": 10
                    }
                },
                "深度研发": {
                    "消耗资源": {
                        "拓展元件": 10
                    }
                }
            }
        },
        "元件类型映射": {
            "基础元件": "所有武器通用",
            "拓展元件-术士": ["法杖", "灵杖", "魔杖", "手杖", "锡杖", "武杖"],
            "拓展元件-近卫": ["剑", "斧", "锤", "爪", "匕首"],
            "拓展元件-狙击": ["手枪", "弓", "弩", "炮", "火枪"],
            "拓展元件-重装": ["盾"]
        }
    };
}

function calculateRequiredMaterials(weaponType, weaponLevel, weaponCategory, researchType, towerData) {
    const materials = {};

    try {
        // 不再计入初火源质，仅计算对应元件数量

        // 组件类型与数量按新规则计算
        const isLevel100 = String(weaponLevel) === '100';
        const isSingleHand = String(weaponCategory) === '单手';

        // 映射拓展元件类型
        let componentType = '基础元件';
        if (researchType === '深度') {
            const weaponMapping = {
                '拓展元件-术士': ['法杖', '灵杖', '魔杖', '手杖', '锡杖', '武杖'],
                '拓展元件-近卫': ['剑', '斧', '锤', '爪', '匕首'],
                '拓展元件-狙击': ['手枪', '弓', '弩', '炮', '火枪'],
                '拓展元件-重装': ['盾']
            };
            for (const [name, list] of Object.entries(weaponMapping)) {
                if (list.includes(weaponType)) {
                    componentType = name;
                    break;
                }
            }
        }

        // 新材料消耗规则
        let componentAmount = 0;
        if (!isLevel100) {
            // 86等武器
            if (researchType === '基础') {
                componentAmount = isSingleHand ? 2 : 4;
            } else if (researchType === '深度') {
                componentAmount = isSingleHand ? 2 : 4;
            }
        } else {
            // 100等武器
            if (researchType === '基础') {
                componentAmount = isSingleHand ? 10 : 20;
            } else if (researchType === '深度') {
                componentAmount = isSingleHand ? 10 : 20;
            }
        }

        // 写入材料结果（仅元件，不含初火源质）
        if (componentAmount > 0) {
            materials[componentType] = componentAmount;
        }
    } catch (error) {
        console.error('计算材料需求时出错:', error);
    }

    return materials;
}

function displayMaterialRequirements(materials, container) {
    if (!materials || Object.keys(materials).length === 0) {
        container.innerHTML = `
            <div class="materials-placeholder">
                <i class="fas fa-info-circle"></i>
                <span>暂无材料需求数据</span>
            </div>
        `;
        return;
    }
    
    let html = '<div class="materials-list">';
    
    for (const [materialName, amount] of Object.entries(materials)) {
        html += `
            <div class="material-item">
                <span class="material-name">${materialName}</span>
                <span class="material-amount">${amount}</span>
            </div>
        `;
    }
    
    html += '</div>';
    container.innerHTML = html;
}

// 更新序列输入验证（根据研发类型动态设定规则）
function updateSequenceInputValidation() {
    const researchType = document.getElementById('research-type')?.value;
    const sequenceInput = document.getElementById('target-sequence');
    if (!sequenceInput) return;

    const maxLen = researchType === '深度' ? 4 : 3;
    sequenceInput.maxLength = maxLen;
    sequenceInput.placeholder = researchType === '深度' ? '请输入4位数字(1-7)' : '请输入3位数字(1-7)';

    // 如果当前输入超过新限制，进行截断
    if (sequenceInput.value.length > maxLen) {
        sequenceInput.value = sequenceInput.value.substring(0, maxLen);
    }
}

// 验证序列输入（仅允许1-7，长度由研发类型决定）
function validateSequenceInput(event) {
    const input = event.target;
    let value = input.value || '';
    const researchType = document.getElementById('research-type')?.value;
    const maxLen = researchType === '深度' ? 4 : 3;

    // 只允许数字1-7
    value = value.replace(/[^1-7]/g, '');

    // 按当前研发类型限制长度
    if (value.length > maxLen) {
        value = value.substring(0, maxLen);
    }

    input.value = value;
}

// （已移除序列键盘事件监听）

// 分析序列模式
function analyzeSequencePattern(sequence) {
    const counts = {};
    for (let char of sequence) {
        counts[char] = (counts[char] || 0) + 1;
    }
    
    const frequencies = Object.values(counts).sort((a, b) => b - a);
    
    if (frequencies.length === 1) {
        // 所有数字相同
        return frequencies[0] === 4 ? 'one_quadruple' : 'one_triple';
    } else if (frequencies.length === 2) {
        if (frequencies[0] === 3) {
            return 'one_triple';
        } else if (frequencies[0] === 2 && frequencies[1] === 2) {
            return 'two_double';
        } else {
            return 'one_double';
        }
    } else if (frequencies.length === 3) {
        return frequencies[0] === 2 ? 'one_double' : 'no_repeat';
    } else {
        return 'no_repeat';
    }
}

// 高塔研究计算
function calculateTowerResearch() {
    try {
        const sequence = document.getElementById('target-sequence')?.value.trim() || '';

        if (!/^[1-7]{3,4}$/.test(sequence)) {
            updateTowerResults(0, 0, 0);
            return;
        }

        // 获取武器参数与研究类型
        const weaponType = document.getElementById('weapon-type')?.value;
        const weaponLevel = document.getElementById('weapon-level')?.value;
        const weaponCategory = document.getElementById('weapon-category')?.value;
        const researchType = document.getElementById('research-type')?.value;

        // 材料需求与价格
        const materials = calculateRequiredMaterials(weaponType, weaponLevel, weaponCategory, researchType, gameData.towerSequence || getDefaultTowerData());
        const prices = getTowerComponentPrices();

        // 计算单次成本：组件数量×对应单价（不含初火源质）
        let singleCost = 0;

        const componentMap = {
            '基础元件': 'basic',
            '拓展元件-术士': 'caster',
            '拓展元件-近卫': 'guard',
            '拓展元件-狙击': 'sniper',
            '拓展元件-重装': 'defense'
        };
        for (const [name, count] of Object.entries(materials)) {
            const key = componentMap[name];
            const unitPrice = key ? (prices[key] || 0) : 0;
            singleCost += (count || 0) * unitPrice;
        }

        // 分析序列模式并选择复杂度（3位→普通；4位→深度）
        const pattern = analyzeSequencePattern(sequence);
        const complexity = sequence.length === 4 ? '深度' : '普通';
        const patternData = towerSystemData.patterns[complexity] || {};
        const successProbability = patternData[pattern] || 1.0;

        // 计算期望成本
        const expectedCost = singleCost / (successProbability / 100);

        updateTowerResults(successProbability, expectedCost, singleCost);

        // 保存组件价格
        saveTowerComponentPrices();
        
    } catch (error) {
        console.error('高塔研究计算错误:', error);
        showNotification('高塔研究计算出错，请检查输入数据', 'error');
    }
}

// 更新高塔结果显示
function updateTowerResults(probability, expectedCost, singleCost) {
    const probabilityElement = document.getElementById('success-probability');
    const expectedCostElement = document.getElementById('expected-cost');
    
    if (probabilityElement) {
        probabilityElement.textContent = `${probability.toFixed(2)}%`;
    }
    
    if (expectedCostElement) {
        expectedCostElement.textContent = `${expectedCost.toFixed(2)}`;
    }
    
}

// 保存高塔组件价格
function saveTowerComponentPrices() {
    const prices = getTowerComponentPrices();
    localStorage.setItem('torchlight-tower-prices', JSON.stringify(prices));
}

// 加载高塔组件价格
function loadTowerComponentPrices() {
    const saved = localStorage.getItem('torchlight-tower-prices');
    if (saved) {
        try {
            const prices = JSON.parse(saved);
            const basicInput = document.getElementById('basic-component-price');
            const casterInput = document.getElementById('caster-component-price');
            const guardInput = document.getElementById('guard-component-price');
            const sniperInput = document.getElementById('sniper-component-price');
            const defenseInput = document.getElementById('defense-component-price');

            if (basicInput) basicInput.value = prices.basic || '';
            if (casterInput) casterInput.value = prices.caster || '';
            if (guardInput) guardInput.value = prices.guard || '';
            if (sniperInput) sniperInput.value = prices.sniper || '';
            if (defenseInput) defenseInput.value = prices.defense || '';
            
            updateTowerMaterialsDisplay();
        } catch (e) {
            console.error('加载高塔组件价格失败:', e);
        }
    }
}

// 获取高塔组件价格
function getTowerComponentPrices() {
    return {
        basic: parseFloat(document.getElementById('basic-component-price')?.value) || 0,
        caster: parseFloat(document.getElementById('caster-component-price')?.value) || 0,
        guard: parseFloat(document.getElementById('guard-component-price')?.value) || 0,
        sniper: parseFloat(document.getElementById('sniper-component-price')?.value) || 0,
        defense: parseFloat(document.getElementById('defense-component-price')?.value) || 0
    };
}

// 数据持久化系统
const DataPersistence = {
    saveAllData() {
        this.saveCraftingData();
        this.saveDamageData();
        this.saveDreamData();
        this.saveSkillData();
        this.saveSealData();
        this.saveTowerData();
    },
    
    loadAllData() {
        this.loadCraftingData();
        this.loadDamageData();
        this.loadDreamData();
        this.loadSkillData();
        this.loadSealData();
        this.loadTowerData();
    },
    
    saveCraftingData() {
        const data = {};
        
        // 保存武器类型和装备等级选择
        const weaponType = document.querySelector('input[name="weapon-type"]:checked');
        const equipmentLevel = document.querySelector('input[name="equipment-level"]:checked');
        
        if (weaponType) data.weaponType = weaponType.value;
        if (equipmentLevel) data.equipmentLevel = equipmentLevel.value;
        
        // 保存词缀选择
        const affixSelects = document.querySelectorAll('.affix-select');
        data.affixes = [];
        affixSelects.forEach((select, index) => {
            data.affixes[index] = select.value;
        });
        
        localStorage.setItem('torchlight-crafting-data', JSON.stringify(data));
    },
    
    loadCraftingData() {
        const saved = localStorage.getItem('torchlight-crafting-data');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                
                // 恢复武器类型选择
                if (data.weaponType) {
                    const weaponRadio = document.querySelector(`input[name="weapon-type"][value="${data.weaponType}"]`);
                    if (weaponRadio) weaponRadio.checked = true;
                }
                
                // 恢复装备等级选择
                 if (data.equipmentLevel) {
                     const levelRadio = document.querySelector(`input[name="equipment-level"][value="${data.equipmentLevel}"]`);
                     if (levelRadio) levelRadio.checked = true;
                 }
                 
                 // 恢复词缀选择
                 if (data.affixes) {
                     const affixSelects = document.querySelectorAll('.affix-select');
                     data.affixes.forEach((value, index) => {
                         if (affixSelects[index]) {
                             affixSelects[index].value = value;
                         }
                     });
                 }
             } catch (e) {
                 console.error('加载打造数据失败:', e);
             }
         }
     },
     
     saveDamageData() {
         const data = {};
         
         // 保存减伤计算数据
         const drRows = document.querySelectorAll('.dr-row');
         data.damageReduction = [];
         drRows.forEach((row, index) => {
             const methodSelect = row.querySelector('.dr-method');
             const layersInput = row.querySelector('.dr-layers');
             const percentInput = row.querySelector('.dr-percent');
             
             if (methodSelect && layersInput && percentInput) {
                 data.damageReduction[index] = {
                     method: methodSelect.value,
                     layers: layersInput.value,
                     percent: percentInput.value
                 };
             }
         });
         
         // 保存叠乘增伤数据
         const singleIncreaseInput = document.getElementById('single-damage-increase');
         const multiplyTimesInput = document.getElementById('multiply-times');
         if (singleIncreaseInput && multiplyTimesInput) {
             data.multiplyDamage = {
                 singleIncrease: singleIncreaseInput.value,
                 multiplyTimes: multiplyTimesInput.value
             };
         }
         
         // 保存伤害提升数据
         const baseDamageInput = document.getElementById('base-damage');
         const improvedDamageInput = document.getElementById('improved-damage');
         if (baseDamageInput && improvedDamageInput) {
             data.damageImprovement = {
                 baseDamage: baseDamageInput.value,
                 improvedDamage: improvedDamageInput.value
             };
         }
         
         localStorage.setItem('torchlight-damage-data', JSON.stringify(data));
     },
     
     loadDamageData() {
         const saved = localStorage.getItem('torchlight-damage-data');
         if (saved) {
             try {
                 const data = JSON.parse(saved);
                 
                 // 恢复减伤计算数据
                 if (data.damageReduction) {
                     const drRows = document.querySelectorAll('.dr-row');
                     data.damageReduction.forEach((rowData, index) => {
                         if (drRows[index] && rowData) {
                             const methodSelect = drRows[index].querySelector('.dr-method');
                             const layersInput = drRows[index].querySelector('.dr-layers');
                             const percentInput = drRows[index].querySelector('.dr-percent');
                             
                             if (methodSelect) methodSelect.value = rowData.method || '';
                             if (layersInput) layersInput.value = rowData.layers || '';
                             if (percentInput) percentInput.value = rowData.percent || '';
                         }
                     });
                 }
                 
                 // 恢复叠乘增伤数据
                 if (data.multiplyDamage) {
                     const singleIncreaseInput = document.getElementById('single-damage-increase');
                     const multiplyTimesInput = document.getElementById('multiply-times');
                     if (singleIncreaseInput) singleIncreaseInput.value = data.multiplyDamage.singleIncrease || '';
                     if (multiplyTimesInput) multiplyTimesInput.value = data.multiplyDamage.multiplyTimes || '';
                 }
                 
                 // 恢复伤害提升数据
                 if (data.damageImprovement) {
                     const baseDamageInput = document.getElementById('base-damage');
                     const improvedDamageInput = document.getElementById('improved-damage');
                     if (baseDamageInput) baseDamageInput.value = data.damageImprovement.baseDamage || '';
                     if (improvedDamageInput) improvedDamageInput.value = data.damageImprovement.improvedDamage || '';
                 }
             } catch (e) {
                 console.error('加载伤害数据失败:', e);
             }
         }
     },
     
     saveDreamData() {
         const data = {};
         
         const equipmentTypeSelect = document.getElementById('equipment-type');
         const equipmentSubtypeSelect = document.getElementById('equipment-subtype');
         const costPerItemInput = document.getElementById('dream-cost-per-item');
         const targetAffixCountInput = document.getElementById('target-affix-count');
         
         if (equipmentTypeSelect) data.equipmentType = equipmentTypeSelect.value;
         if (equipmentSubtypeSelect) data.equipmentSubtype = equipmentSubtypeSelect.value;
         if (costPerItemInput) data.costPerItem = costPerItemInput.value;
         if (targetAffixCountInput) data.targetAffixCount = targetAffixCountInput.value;
         
         localStorage.setItem('torchlight-dream-data', JSON.stringify(data));
     },
     
     loadDreamData() {
         const saved = localStorage.getItem('torchlight-dream-data');
         if (saved) {
             try {
                 const data = JSON.parse(saved);
                 
                 const equipmentTypeSelect = document.getElementById('equipment-type');
                 const equipmentSubtypeSelect = document.getElementById('equipment-subtype');
                 const costPerItemInput = document.getElementById('dream-cost-per-item');
                 const targetAffixCountInput = document.getElementById('target-affix-count');
                 
                 if (equipmentTypeSelect && data.equipmentType) {
                     equipmentTypeSelect.value = data.equipmentType;
                     equipmentTypeSelect.dispatchEvent(new Event('change'));
                 }
                 if (equipmentSubtypeSelect && data.equipmentSubtype) {
                     setTimeout(() => {
                         equipmentSubtypeSelect.value = data.equipmentSubtype;
                     }, 100);
                 }
                 if (costPerItemInput) costPerItemInput.value = data.costPerItem || '';
                 if (targetAffixCountInput) targetAffixCountInput.value = data.targetAffixCount || '';
             } catch (e) {
                 console.error('加载梦境数据失败:', e);
             }
         }
     },
     
     saveSkillData() {
         const data = {};
         
         const currentLevelSelect = document.getElementById('current-level');
         const targetLevelSelect = document.getElementById('target-level');
         const inspirationPriceInput = document.getElementById('inspiration-price');
         
         if (currentLevelSelect) data.currentLevel = currentLevelSelect.value;
         if (targetLevelSelect) data.targetLevel = targetLevelSelect.value;
         if (inspirationPriceInput) data.inspirationPrice = inspirationPriceInput.value;
         
         // 保存材料数量和价格
         ['t0', 't1', 't2'].forEach(tier => {
             const quantityInput = document.getElementById(`${tier}-quantity`);
             const priceInput = document.getElementById(`${tier}-price`);
             if (quantityInput) data[`${tier}Quantity`] = quantityInput.value;
             if (priceInput) data[`${tier}Price`] = priceInput.value;
         });
         
         localStorage.setItem('torchlight-skill-data', JSON.stringify(data));
     },
     
     loadSkillData() {
         const saved = localStorage.getItem('torchlight-skill-data');
         if (saved) {
             try {
                 const data = JSON.parse(saved);
                 
                 const currentLevelSelect = document.getElementById('current-level');
                 const targetLevelSelect = document.getElementById('target-level');
                 const inspirationPriceInput = document.getElementById('inspiration-price');
                 
                 if (currentLevelSelect && data.currentLevel) {
                     currentLevelSelect.value = data.currentLevel;
                     currentLevelSelect.dispatchEvent(new Event('change'));
                 }
                 if (targetLevelSelect && data.targetLevel) {
                     setTimeout(() => {
                         targetLevelSelect.value = data.targetLevel;
                     }, 100);
                 }
                 if (inspirationPriceInput) inspirationPriceInput.value = data.inspirationPrice || '';
                 
                 // 恢复材料数量和价格
                 ['t0', 't1', 't2'].forEach(tier => {
                     const quantityInput = document.getElementById(`${tier}-quantity`);
                     const priceInput = document.getElementById(`${tier}-price`);
                     if (quantityInput) quantityInput.value = data[`${tier}Quantity`] || '';
                     if (priceInput) priceInput.value = data[`${tier}Price`] || '';
                 });
             } catch (e) {
                 console.error('加载技能数据失败:', e);
             }
         }
     },
     
     saveSealData() {
         const data = {};
         
         const sealLevelInput = document.getElementById('seal-level');
         const sealCostPerLevelInput = document.getElementById('seal-cost-per-level');
         const haloCountInput = document.getElementById('halo-count');
         const haloCostPerItemInput = document.getElementById('halo-cost-per-item');
         
         if (sealLevelInput) data.sealLevel = sealLevelInput.value;
         if (sealCostPerLevelInput) data.sealCostPerLevel = sealCostPerLevelInput.value;
         if (haloCountInput) data.haloCount = haloCountInput.value;
         if (haloCostPerItemInput) data.haloCostPerItem = haloCostPerItemInput.value;
         
         localStorage.setItem('torchlight-seal-data', JSON.stringify(data));
     },
     
     loadSealData() {
         const saved = localStorage.getItem('torchlight-seal-data');
         if (saved) {
             try {
                 const data = JSON.parse(saved);
                 
                 const sealLevelInput = document.getElementById('seal-level');
                 const sealCostPerLevelInput = document.getElementById('seal-cost-per-level');
                 const haloCountInput = document.getElementById('halo-count');
                 const haloCostPerItemInput = document.getElementById('halo-cost-per-item');
                 
                 if (sealLevelInput) sealLevelInput.value = data.sealLevel || '';
                 if (sealCostPerLevelInput) sealCostPerLevelInput.value = data.sealCostPerLevel || '';
                 if (haloCountInput) haloCountInput.value = data.haloCount || '';
                 if (haloCostPerItemInput) haloCostPerItemInput.value = data.haloCostPerItem || '';
             } catch (e) {
                 console.error('加载封印数据失败:', e);
             }
         }
     },
     
     saveTowerData() {
         const data = {};
         
         const sequenceInput = document.getElementById('target-sequence');
         const researchTypeSelect = document.getElementById('research-type');
         
         if (sequenceInput) data.sequence = sequenceInput.value;
         if (researchTypeSelect) data.researchType = researchTypeSelect.value;
         
         localStorage.setItem('torchlight-tower-data', JSON.stringify(data));
     },
     
     loadTowerData() {
         const saved = localStorage.getItem('torchlight-tower-data');
         if (saved) {
             try {
                 const data = JSON.parse(saved);
                 
                 const sequenceInput = document.getElementById('target-sequence');
                 const researchTypeSelect = document.getElementById('research-type');
                 
                 if (researchTypeSelect && data.researchType) {
                     researchTypeSelect.value = data.researchType;
                     researchTypeSelect.dispatchEvent(new Event('change'));
                 }
                 if (sequenceInput && data.sequence) {
                     sequenceInput.value = data.sequence;
                     validateSequenceInput({ target: sequenceInput });
                     updateSequenceInputValidation();
                 }
             } catch (e) {
                 console.error('加载高塔数据失败:', e);
             }
         }
     }
 };

// 设置自动保存
function setupAutoSave() {
    // 每30秒自动保存一次
    setInterval(() => {
        DataPersistence.saveAllData();
    }, 30000);

    // 页面关闭前保存
    window.addEventListener('beforeunload', () => {
        DataPersistence.saveAllData();
    });
}

// 深色模式开关
function setupThemeToggle() {
    const checkbox = document.getElementById('theme-switch');
    if (!checkbox) return;

    const root = document.documentElement;
    const applyTheme = (theme) => {
        if (theme === 'dark') {
            root.setAttribute('data-theme', 'dark');
        } else {
            root.removeAttribute('data-theme');
        }
    };

    // 读取持久化主题
    const saved = localStorage.getItem('theme');
    if (saved) {
        applyTheme(saved);
        checkbox.checked = saved === 'dark';
    }

    // 监听切换
    checkbox.addEventListener('change', () => {
        const theme = checkbox.checked ? 'dark' : 'light';
        applyTheme(theme);
        localStorage.setItem('theme', theme);
    });
}

// 设置侧边栏折叠功能
function setupSidebarToggle() {
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (!sidebarToggle || !sidebar) return;

    // 从localStorage加载侧边栏状态
    const savedCollapsed = localStorage.getItem('sidebarCollapsed');
    if (savedCollapsed === 'true') {
        sidebar.classList.add('collapsed');
    }

    // 监听折叠按钮点击
    sidebarToggle.addEventListener('click', function() {
        sidebar.classList.toggle('collapsed');
        
        // 保存状态到localStorage
        const isCollapsed = sidebar.classList.contains('collapsed');
        localStorage.setItem('sidebarCollapsed', isCollapsed.toString());
    });
}

// 通知系统
function showNotification(message, type = 'info') {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // 添加到页面
    document.body.appendChild(notification);
    
    // 显示动画
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // 自动隐藏
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// 添加减伤行
function addDamageReductionRow() {
    const container = document.getElementById('dr-rows-container');
    if (!container) return;
    
    const rowCount = container.children.length + 1;
    const newRow = document.createElement('div');
    newRow.className = 'dr-row';
    newRow.innerHTML = `
        <div class="input-group">
            <label>序号${rowCount}：</label>
            <select class="dr-method">
                <option value="additive">加法减伤</option>
                <option value="multiply">乘法减伤</option>
            </select>
            <input type="number" class="dr-layers" placeholder="层数" min="0" step="1">
            <input type="number" class="dr-percent" placeholder="每层减伤%" min="0" max="100" step="0.01">
            <button type="button" onclick="removeDamageReductionRow(this)" class="remove-btn">删除</button>
        </div>
    `;
    
    container.appendChild(newRow);
    
    // 添加事件监听器
    const methodSelect = newRow.querySelector('.dr-method');
    const layersInput = newRow.querySelector('.dr-layers');
    const percentInput = newRow.querySelector('.dr-percent');
    
    [methodSelect, layersInput, percentInput].forEach(element => {
        if (element) {
            element.addEventListener('change', calculateDamageReduction);
            element.addEventListener('input', calculateDamageReduction);
        }
    });
}

// 删除减伤行
function removeDamageReductionRow(button) {
    const row = button.closest('.dr-row');
    if (row) {
        row.remove();
        calculateDamageReduction();
        
        // 重新编号
        const container = document.getElementById('dr-rows-container');
        if (container) {
            const rows = container.querySelectorAll('.dr-row');
            rows.forEach((row, index) => {
                const label = row.querySelector('label');
                if (label) {
                    label.textContent = `序号${index + 1}：`;
                }
            });
        }
    }
}

// 模块切换函数
function showCraftingModule(moduleType) {
    // 隐藏所有打造子模块
    const craftingModules = document.querySelectorAll('.crafting-module');
    craftingModules.forEach(module => {
        module.style.display = 'none';
    });
    
    // 移除所有按钮的活动状态
    const craftingButtons = document.querySelectorAll('.crafting-function-buttons .function-btn');
    craftingButtons.forEach(btn => btn.classList.remove('active'));
    
    // 显示指定的模块
    const targetModule = document.getElementById(moduleType);
    if (targetModule) {
        targetModule.style.display = 'block';
    }
    
    // 激活对应的按钮
    const activeButton = document.querySelector(`[onclick="showCraftingModule('${moduleType}')"]`);
    if (activeButton) {
        activeButton.classList.add('active');
    }
}

function showDamageModule(moduleType) {
    // 隐藏所有伤害子模块
    const damageModules = document.querySelectorAll('.damage-module');
    damageModules.forEach(module => {
        module.style.display = 'none';
    });
    
    // 移除所有按钮的活动状态
    const damageButtons = document.querySelectorAll('.damage-function-buttons .function-btn');
    damageButtons.forEach(btn => btn.classList.remove('active'));
    
    // 显示指定的模块
    const targetModule = document.getElementById(moduleType);
    if (targetModule) {
        targetModule.style.display = 'block';
    }
    
    // 激活对应的按钮
    const activeButton = document.querySelector(`[onclick="showDamageModule('${moduleType}')"]`);
    if (activeButton) {
        activeButton.classList.add('active');
    }
}

function showHarvestModule() {
    hideAllModules();
    const module = document.getElementById('harvest-module');
    if (module) {
        module.style.display = 'block';
        currentTab = 'harvest';
    }
}

function showDreamModule() {
    hideAllModules();
    const module = document.getElementById('dream-module');
    if (module) {
        module.style.display = 'block';
        currentTab = 'dream';
    }
}

function showSkillModule() {
    hideAllModules();
    const module = document.getElementById('skill-module');
    if (module) {
        module.style.display = 'block';
        currentTab = 'skill';
    }
}

function showSealModule() {
    hideAllModules();
    const module = document.getElementById('seal-module');
    if (module) {
        module.style.display = 'block';
        currentTab = 'seal';
    }
}

function showTowerModule() {
    hideAllModules();
    const module = document.getElementById('tower-module');
    if (module) {
        module.style.display = 'block';
        currentTab = 'tower';
    }
}

function showErosionModule() {
    hideAllModules();
    const module = document.getElementById('erosion-module');
    if (module) {
        module.style.display = 'block';
        currentTab = 'erosion';
    }
}

function hideAllModules() {
    const modules = [
        'crafting-module', 'damage-module', 'harvest-module', 
        'dream-module', 'skill-module', 'seal-module', 
        'tower-module', 'erosion-module'
    ];
    
    modules.forEach(moduleId => {
        const module = document.getElementById(moduleId);
        if (module) {
            module.style.display = 'none';
        }
    });
}

function switchDamageType(type) {
    // 获取武器伤害计算模块内的切换按钮
    const physicalToggle = document.getElementById('physical-toggle');
    const elementalToggle = document.getElementById('elemental-toggle');
    
    // 获取对应的内容区域
    const physicalInputs = document.getElementById('physical-damage-inputs');
    const elementalInputs = document.getElementById('elemental-damage-inputs');
    
    if (!physicalToggle || !elementalToggle || !physicalInputs || !elementalInputs) return;
    
    // 移除所有按钮的活动状态
    physicalToggle.classList.remove('active');
    elementalToggle.classList.remove('active');
    
    // 隐藏所有部分
    physicalInputs.style.display = 'none';
    elementalInputs.style.display = 'none';
    
    // 显示选中的部分并激活对应按钮
    switch(type) {
        case 'physical':
            physicalInputs.style.display = 'block';
            physicalToggle.classList.add('active');
            break;
        case 'elemental':
            elementalInputs.style.display = 'block';
            elementalToggle.classList.add('active');
            break;
    }
}

// 武器伤害计算函数
function calculateWeaponDamage() {
    try {
        // 检查当前是物理伤害还是元素伤害模式
        const physicalInputs = document.getElementById('physical-damage-inputs');
        const elementalInputs = document.getElementById('elemental-damage-inputs');
        
        const isPhysicalMode = physicalInputs && physicalInputs.style.display !== 'none';
        
        if (isPhysicalMode) {
            calculatePhysicalDamage();
        } else {
            calculateElementalDamage();
        }
        
    } catch (error) {
        console.error('武器伤害计算错误:', error);
        showNotification('武器伤害计算出错，请检查输入数据', 'error');
    }
}

// 物理伤害计算
function calculatePhysicalDamage() {
    // 获取输入值
    const weaponMinDamage = parseFloat(document.getElementById('weapon-min-damage')?.value) || 0;
    const weaponMaxDamage = parseFloat(document.getElementById('weapon-max-damage')?.value) || 0;
    const weaponAttackSpeed = parseFloat(document.getElementById('weapon-attack-speed')?.value) || 1;
    const otherBaseDamage = parseFloat(document.getElementById('other-base-damage')?.value) || 0;
    const increasedDamage = parseFloat(document.getElementById('increased-damage')?.value) || 0;
    const moreDamage1 = parseFloat(document.getElementById('more-damage1')?.value) || 0;
    const moreDamage2 = parseFloat(document.getElementById('more-damage2')?.value) || 0;
    const moreDamage3 = parseFloat(document.getElementById('more-damage3')?.value) || 0;
    
    // 验证输入
    if (weaponMinDamage <= 0 && weaponMaxDamage <= 0) {
        showNotification('请输入有效的武器伤害值', 'warning');
        return;
    }
    
    // 计算基础物理伤害
    const baseWeaponDamage = (weaponMinDamage + weaponMaxDamage) / 2;
    const totalBaseDamage = baseWeaponDamage + otherBaseDamage;
    
    // 计算增加伤害修正
    const increasedMultiplier = 1 + (increasedDamage / 100);
    
    // 计算额外伤害修正
    const moreMultiplier1 = 1 + (moreDamage1 / 100);
    const moreMultiplier2 = 1 + (moreDamage2 / 100);
    const moreMultiplier3 = 1 + (moreDamage3 / 100);
    
    // 最终伤害计算
    const finalDamage = totalBaseDamage * increasedMultiplier * moreMultiplier1 * moreMultiplier2 * moreMultiplier3;
    const weaponDPS = finalDamage * weaponAttackSpeed;
    
    // 更新显示
    updateWeaponDamageResults({
        basePhysicalDamage: Math.round(totalBaseDamage),
        weaponDPS: Math.round(weaponDPS),
        finalHitDamage: Math.round(finalDamage)
    });
    
    showNotification('物理伤害计算完成！', 'success');
}

// 元素伤害计算
function calculateElementalDamage() {
    // 获取攻击速度
    const attackSpeed = parseFloat(document.getElementById('elemental-attack-speed')?.value) || 1;
    
    // 计算各元素伤害
    const lightningDamage = calculateElementalTypeDamage('lightning');
    const coldDamage = calculateElementalTypeDamage('cold');
    const fireDamage = calculateElementalTypeDamage('fire');
    
    // 计算总伤害
    const totalDamage = lightningDamage + coldDamage + fireDamage;
    const totalDPS = totalDamage * attackSpeed;
    
    // 更新显示
    updateWeaponDamageResults({
        basePhysicalDamage: 0,
        weaponDPS: Math.round(totalDPS),
        finalHitDamage: Math.round(totalDamage)
    });
    
    showNotification('元素伤害计算完成！', 'success');
}

// 计算单个元素类型伤害
function calculateElementalTypeDamage(elementType) {
    const minDamage = parseFloat(document.getElementById(`weapon-min-${elementType}`)?.value) || 0;
    const maxDamage = parseFloat(document.getElementById(`weapon-max-${elementType}`)?.value) || 0;
    const otherDamage = parseFloat(document.getElementById(`other-${elementType}-damage`)?.value) || 0;
    const increased = parseFloat(document.getElementById(`increased-${elementType}`)?.value) || 0;
    const more1 = parseFloat(document.getElementById(`more-${elementType}1`)?.value) || 0;
    const more2 = parseFloat(document.getElementById(`more-${elementType}2`)?.value) || 0;
    const more3 = parseFloat(document.getElementById(`more-${elementType}3`)?.value) || 0;
    
    // 计算基础伤害
    const baseDamage = (minDamage + maxDamage) / 2 + otherDamage;
    
    // 计算修正
    const increasedMultiplier = 1 + (increased / 100);
    const moreMultiplier1 = 1 + (more1 / 100);
    const moreMultiplier2 = 1 + (more2 / 100);
    const moreMultiplier3 = 1 + (more3 / 100);
    
    return baseDamage * increasedMultiplier * moreMultiplier1 * moreMultiplier2 * moreMultiplier3;
}

// 更新武器伤害结果显示
function updateWeaponDamageResults(results) {
    const elements = {
        basePhysicalDamage: document.getElementById('base-physical-damage'),
        weaponDPS: document.getElementById('weapon-dps'),
        finalHitDamage: document.getElementById('final-hit-damage')
    };
    
    Object.keys(elements).forEach(key => {
        const element = elements[key];
        if (element && results[key] !== undefined) {
            element.textContent = results[key].toLocaleString();
            animateResultUpdate(element.id);
        }
    });
}

// 初始化侵蚀模拟系统
function initializeErosionSimulation() {
    console.log('初始化侵蚀模拟系统');
    console.log('当前 gameData 状态:', gameData);
    
    // 检查传奇装备数据是否已加载
    if (!gameData || !gameData.legendaryEquipment) {
        console.error('传奇装备数据未加载！');
        alert('传奇装备数据未加载，请检查数据文件！');
        return;
    }
    
    // 初始化装备列表
    populateEquipmentList();
    
    // 初始化侵蚀模拟相关的事件监听器
    setupErosionEventListeners();
}

// 填充装备列表
function populateEquipmentList(equipmentType = '') {
    console.log('populateEquipmentList 被调用，装备类型:', equipmentType);
    console.log('gameData:', gameData);
    console.log('gameData.legendaryEquipment:', gameData.legendaryEquipment);
    
    const equipmentSelect = document.getElementById('equipment-name');
    if (!equipmentSelect || !gameData.legendaryEquipment) {
        console.log('装备选择器或传奇装备数据未找到');
        console.log('equipmentSelect:', equipmentSelect);
        console.log('gameData.legendaryEquipment:', gameData.legendaryEquipment);
        return;
    }
    
    // 清空现有选项
    equipmentSelect.innerHTML = '<option value="">请选择装备</option>';
    
    // 如果没有选择装备类型，显示提示
    if (!equipmentType) {
        equipmentSelect.innerHTML = '<option value="">请先选择装备类型</option>';
        return;
    }
    
    // 根据传奇装备.json的实际结构处理数据
    try {
        const equipmentData = gameData.legendaryEquipment;
        let availableEquipment = [];
        
        console.log('装备数据结构:', equipmentData);
        console.log('选择的装备类型:', equipmentType);
        
        if (equipmentData && equipmentData.装备数据) {
            console.log('装备数据对象:', equipmentData.装备数据);
            
            // 直接从装备数据中获取对应类型的装备数组
            if (equipmentData.装备数据[equipmentType]) {
                const equipmentArray = equipmentData.装备数据[equipmentType];
                console.log(`找到装备类型 ${equipmentType} 的数据:`, equipmentArray);
                
                if (Array.isArray(equipmentArray)) {
                    availableEquipment = equipmentArray;
                    console.log('成功获取装备列表:', availableEquipment.map(eq => eq.名称 || eq.装备名称 || '未知'));
                } else {
                    console.warn('装备数据不是数组格式:', equipmentArray);
                }
            } else {
                console.log(`装备数据中没有找到类型 "${equipmentType}"`);
                console.log('可用的装备类型:', Object.keys(equipmentData.装备数据));
            }
        }
        
        // 如果仍然没有找到数据，尝试从装备类型数据中获取装备名称列表
        if (availableEquipment.length === 0 && equipmentData && equipmentData.装备类型) {
            console.log('装备类型数据:', equipmentData.装备类型);
            
            // 查找装备类型映射
            for (const categoryKey in equipmentData.装备类型) {
                const categoryEquipment = equipmentData.装备类型[categoryKey];
                if (Array.isArray(categoryEquipment) && categoryEquipment.includes(equipmentType)) {
                    console.log(`在装备类型 "${categoryKey}" 中找到 "${equipmentType}"`);
                    
                    // 从装备数据中获取该类型的装备
                     if (equipmentData.装备数据[equipmentType]) {
                         availableEquipment = equipmentData.装备数据[equipmentType];
                         console.log('通过装备类型映射找到装备:', availableEquipment.map(eq => eq.名称 || eq.装备名称 || '未知'));
                         break;
                    }
                }
            }
        }
        
        // 填充装备选项
        if (availableEquipment.length > 0) {
            availableEquipment.forEach(equipment => {
                const option = document.createElement('option');
                const equipmentName = equipment.名称 || equipment.装备名称 || equipment.name || '未知装备';
                const equipmentLevel = equipment.需求等级 || equipment.level || 1;
                
                option.value = equipmentName;
                option.textContent = equipmentName;
                option.dataset.category = equipmentType;
                option.dataset.level = equipmentLevel;
                equipmentSelect.appendChild(option);
            });
        } else {
            equipmentSelect.innerHTML = '<option value="">该类型暂无装备数据</option>';
            console.warn(`未找到装备类型 "${equipmentType}" 的数据`);
            console.log('可用的装备类型:', Object.keys(equipmentData.装备数据 || {}));
        }
        
    } catch (error) {
        console.error('填充装备列表时出错:', error);
        equipmentSelect.innerHTML = '<option value="">装备数据加载失败</option>';
    }
}

// 设置侵蚀事件监听器
function setupErosionEventListeners() {
    console.log('设置侵蚀事件监听器');
    
    // 装备类型选择变化事件
    const equipmentTypeSelect = document.getElementById('equipment-type');
    if (equipmentTypeSelect) {
        equipmentTypeSelect.addEventListener('change', function() {
            const selectedType = this.value;
            populateEquipmentList(selectedType);
            
            // 清空装备显示
            updateEquipmentDisplay('');
            
            // 显示/隐藏武器子类型选择
            const weaponSubtypeGroup = document.getElementById('weapon-subtype-group');
            if (weaponSubtypeGroup) {
                if (selectedType === '单手' || selectedType === '双手') {
                    weaponSubtypeGroup.style.display = 'block';
                    populateWeaponSubtypes(selectedType);
                } else {
                    weaponSubtypeGroup.style.display = 'none';
                }
            }
        });
    }
    
    // 装备名称选择变化事件
    const equipmentSelect = document.getElementById('equipment-name');
    if (equipmentSelect) {
        equipmentSelect.addEventListener('change', function() {
            updateEquipmentDisplay(this.value);
        });
    }
    
    // 侵蚀模拟计算按钮 - 修正ID
    const erosionCalculateBtn = document.querySelector('.calculate-erosion-btn');
    if (erosionCalculateBtn) {
        erosionCalculateBtn.addEventListener('click', calculateErosionCost);
    }
    
    // 侵蚀模拟重置按钮 - 修正ID和选择器
    const erosionResetBtn = document.querySelector('#erosion-simulation .reset-btn');
    if (erosionResetBtn) {
        erosionResetBtn.addEventListener('click', resetErosionCount);
    }
}

// 更新装备显示信息
function updateEquipmentDisplay(equipmentName) {
    // 更新装备名称显示
    const displayNameElement = document.getElementById('display-equipment-name');
    const displayLevelElement = document.getElementById('display-equipment-level');
    const baseAffixesElement = document.getElementById('base-affixes');
    const normalAffixesElement = document.getElementById('normal-affixes');
    const erosionAffixesElement = document.getElementById('erosion-affixes');
    const erosionAffixesSection = document.getElementById('erosion-affixes-section');
    
    // 如果没有选择装备，显示默认状态
    if (!equipmentName) {
        if (displayNameElement) displayNameElement.textContent = '请选择装备';
        if (displayLevelElement) displayLevelElement.textContent = '等级: --';
        if (baseAffixesElement) baseAffixesElement.innerHTML = '<p class="no-affixes">请选择装备</p>';
        if (normalAffixesElement) normalAffixesElement.innerHTML = '<p class="no-affixes">请选择装备</p>';
        if (erosionAffixesSection) erosionAffixesSection.style.display = 'none';
        return;
    }
    
    // 检查传奇装备数据是否加载
    if (!gameData.legendaryEquipment) {
        if (displayNameElement) displayNameElement.textContent = '数据加载失败';
        if (displayLevelElement) displayLevelElement.textContent = '等级: --';
        if (baseAffixesElement) baseAffixesElement.innerHTML = '<p class="no-affixes">传奇装备数据未加载</p>';
        if (normalAffixesElement) normalAffixesElement.innerHTML = '<p class="no-affixes">传奇装备数据未加载</p>';
        return;
    }
    
    try {
        // 查找装备数据
        let selectedEquipment = null;
        const equipmentData = gameData.legendaryEquipment.装备数据;
        
        if (!equipmentData) {
            throw new Error('装备数据格式错误');
        }
        
        // 遍历所有装备类型查找目标装备
        for (const equipmentTypeKey in equipmentData) {
            const equipmentArray = equipmentData[equipmentTypeKey];
            if (Array.isArray(equipmentArray)) {
                for (const equipment of equipmentArray) {
                    const equipmentName_check = equipment.名称 || equipment.装备名称;
                    if (equipmentName_check === equipmentName) {
                        selectedEquipment = equipment;
                        break;
                    }
                }
                if (selectedEquipment) break;
            }
        }
        
        if (!selectedEquipment) {
            if (displayNameElement) displayNameElement.textContent = '装备未找到';
            if (displayLevelElement) displayLevelElement.textContent = '等级: --';
            if (baseAffixesElement) baseAffixesElement.innerHTML = '<p class="no-affixes">未找到装备信息</p>';
            if (normalAffixesElement) normalAffixesElement.innerHTML = '<p class="no-affixes">未找到装备信息</p>';
            return;
        }
        
        // 更新装备基本信息
        const equipmentDisplayName = selectedEquipment.名称 || selectedEquipment.装备名称 || '未知装备';
        if (displayNameElement) displayNameElement.textContent = equipmentDisplayName;
        if (displayLevelElement) displayLevelElement.textContent = `等级: ${selectedEquipment.需求等级}`;
        
        // 更新装备图标
        const equipmentImage = document.getElementById('equipment-image');
        const placeholderIcon = document.querySelector('.placeholder-icon');
        if (equipmentImage && equipmentDisplayName && equipmentDisplayName !== '未知装备') {
            const imagePath = `传奇/${equipmentDisplayName}.webp`;
            console.log('尝试加载装备图标:', imagePath);
            equipmentImage.src = imagePath;
            equipmentImage.style.display = 'block';
            if (placeholderIcon) placeholderIcon.style.display = 'none';
            
            // 处理图片加载失败的情况
            equipmentImage.onerror = function() {
                console.warn('装备图标加载失败:', imagePath);
                this.style.display = 'none';
                if (placeholderIcon) placeholderIcon.style.display = 'block';
            };
            
            // 处理图片加载成功的情况
            equipmentImage.onload = function() {
                console.log('装备图标加载成功:', imagePath);
            };
        } else if (placeholderIcon) {
            if (equipmentImage) equipmentImage.style.display = 'none';
            placeholderIcon.style.display = 'block';
        }
        
        // 更新基础词缀
        if (baseAffixesElement) {
            if (selectedEquipment.基础词缀) {
                baseAffixesElement.innerHTML = `<p class="affix-item">${selectedEquipment.基础词缀}</p>`;
            } else {
                baseAffixesElement.innerHTML = '<p class="no-affixes">无基础词缀</p>';
            }
        }
        
        // 更新普通词缀
        if (normalAffixesElement) {
            if (selectedEquipment.普通词缀 && selectedEquipment.普通词缀.length > 0) {
                normalAffixesElement.innerHTML = selectedEquipment.普通词缀
                    .map(affix => `<p class="affix-item">${affix}</p>`)
                    .join('');
            } else {
                normalAffixesElement.innerHTML = '<p class="no-affixes">无普通词缀</p>';
            }
        }
        
        // 更新已侵蚀词缀
        if (erosionAffixesElement && erosionAffixesSection) {
            if (selectedEquipment.已侵蚀词缀 && selectedEquipment.已侵蚀词缀.length > 0) {
                erosionAffixesElement.innerHTML = selectedEquipment.已侵蚀词缀
                    .map(affix => `<p class="affix-item eroded">${affix}</p>`)
                    .join('');
                erosionAffixesSection.style.display = 'block';
            } else {
                erosionAffixesSection.style.display = 'none';
            }
        }
        
    } catch (error) {
        console.error('显示装备信息时出错:', error);
        if (displayNameElement) displayNameElement.textContent = '显示错误';
        if (displayLevelElement) displayLevelElement.textContent = '等级: --';
        if (baseAffixesElement) baseAffixesElement.innerHTML = '<p class="no-affixes">显示装备信息失败</p>';
        if (normalAffixesElement) normalAffixesElement.innerHTML = '<p class="no-affixes">显示装备信息失败</p>';
    }
}

function calculateErosionSimulation() {
    console.log('计算侵蚀模拟');
    
    const equipmentSelect = document.getElementById('erosion-equipment-select');
    const erosionLevelInput = document.getElementById('erosion-level');
    const erosionCountInput = document.getElementById('erosion-count');
    
    if (!equipmentSelect || !equipmentSelect.value) {
        showNotification('请先选择装备', 'warning');
        return;
    }
    
    const erosionLevel = parseInt(erosionLevelInput?.value) || 1;
    const erosionCount = parseInt(erosionCountInput?.value) || 1;
    
    // 基础侵蚀成功率计算（示例公式）
    const baseSuccessRate = 0.1; // 10%基础成功率
    const levelModifier = Math.max(0.01, 1 - (erosionLevel - 1) * 0.02); // 等级修正
    const finalSuccessRate = baseSuccessRate * levelModifier;
    
    // 计算期望次数和成本
    const expectedAttempts = 1 / finalSuccessRate;
    const singleCost = 100; // 单次侵蚀成本（示例值）
    const totalExpectedCost = expectedAttempts * singleCost * erosionCount;
    
    // 显示结果
    const resultElement = document.getElementById('erosion-result');
    if (resultElement) {
        resultElement.innerHTML = `
            <div class="erosion-results">
                <h4>侵蚀模拟结果</h4>
                <p><strong>装备:</strong> ${equipmentSelect.value}</p>
                <p><strong>侵蚀等级:</strong> ${erosionLevel}</p>
                <p><strong>侵蚀次数:</strong> ${erosionCount}</p>
                <p><strong>成功率:</strong> ${(finalSuccessRate * 100).toFixed(2)}%</p>
                <p><strong>期望尝试次数:</strong> ${expectedAttempts.toFixed(1)}</p>
                <p><strong>预期总成本:</strong> ${totalExpectedCost.toFixed(0)} 初火源质</p>
            </div>
        `;
    }
    
    showNotification('侵蚀模拟计算完成！', 'success');
}

function resetErosionSimulation() {
    console.log('重置侵蚀模拟');
    // 重置侵蚀模拟相关的输入字段
    const erosionInputs = document.querySelectorAll('#erosion-module input');
    erosionInputs.forEach(input => {
        if (input.type === 'number' || input.type === 'text') {
            input.value = '';
        }
    });
    
    // 清空结果显示
    const erosionResult = document.getElementById('erosion-result');
    if (erosionResult) {
        erosionResult.innerHTML = '';
    }
}

// 计算侵蚀成本
function calculateErosionCost() {
    console.log('计算侵蚀成本');
    
    const targetUpgradeCount = parseInt(document.getElementById('target-upgrade-count')?.value) || 1;
    const equipmentAffixCount = parseInt(document.getElementById('equipment-affix-count')?.value) || 4;
    const erosionType = document.querySelector('.erosion-type-btn.active')?.id === 'cost-dark-btn' ? 'dark' : 'deepest';
    
    // 基础成本计算
    let baseCost = erosionType === 'dark' ? 50 : 100; // 暗黑侵蚀50，深渊侵蚀100
    let successRate = erosionType === 'dark' ? 0.1 : 0.05; // 暗黑10%，深渊5%
    
    // 根据词条数调整成功率
    successRate = successRate / equipmentAffixCount;
    
    // 计算期望次数
    const expectedAttempts = Math.ceil(targetUpgradeCount / successRate);
    const totalCost = expectedAttempts * baseCost;
    
    // 显示结果
    const resultElement = document.getElementById('erosion-cost-result');
    if (resultElement) {
        resultElement.style.display = 'block';
        resultElement.innerHTML = `
            <h4>侵蚀成本计算结果</h4>
            <p><strong>侵蚀类型:</strong> ${erosionType === 'dark' ? '暗黑侵蚀' : '深渊侵蚀'}</p>
            <p><strong>目标升级次数:</strong> ${targetUpgradeCount}</p>
            <p><strong>装备词条数:</strong> ${equipmentAffixCount}</p>
            <p><strong>单次成功率:</strong> ${(successRate * 100).toFixed(2)}%</p>
            <p><strong>期望尝试次数:</strong> <span id="expected-erosion-count">${expectedAttempts}</span></p>
            <p><strong>预计总成本:</strong> ${totalCost} 初火源质</p>
        `;
    }
    
    showNotification('侵蚀成本计算完成！', 'success');
    
    // 保存追忆打造材料价格
    const memoryMaterials = {
        fragmentPrice: fragmentPrice,
        threadPrice: threadPrice
    };
    
    // 保存到localStorage
    localStorage.setItem('memory-material-prices', JSON.stringify(memoryMaterials));
}

// 重置侵蚀计数
function resetErosionCount() {
    console.log('重置侵蚀计数');
    
    // 重置输入字段
    const targetUpgradeCount = document.getElementById('target-upgrade-count');
    const equipmentAffixCount = document.getElementById('equipment-affix-count');
    
    if (targetUpgradeCount) targetUpgradeCount.value = '1';
    if (equipmentAffixCount) equipmentAffixCount.value = '4';
    
    // 重置侵蚀类型选择
    const darkBtn = document.getElementById('cost-dark-btn');
    const deepestBtn = document.getElementById('cost-deepest-btn');
    
    if (darkBtn) darkBtn.classList.add('active');
    if (deepestBtn) deepestBtn.classList.remove('active');
    
    // 清空结果显示
    const resultElement = document.getElementById('erosion-cost-result');
    if (resultElement) {
        resultElement.style.display = 'none';
        resultElement.innerHTML = '';
    }
    
    // 重置统计数据
    const erosionCount = document.getElementById('erosion-count');
    const totalErosionCost = document.getElementById('total-erosion-cost');
    
    if (erosionCount) erosionCount.textContent = '0';
    if (totalErosionCost) totalErosionCost.textContent = '0 初火源质';
    
    showNotification('侵蚀数据已重置', 'info');
}

// 选择侵蚀类型
function selectErosionType(type) {
    const darkBtn = document.getElementById('cost-dark-btn');
    const deepestBtn = document.getElementById('cost-deepest-btn');
    
    if (type === 'dark') {
        darkBtn.classList.add('active');
        deepestBtn.classList.remove('active');
    } else {
        deepestBtn.classList.add('active');
        darkBtn.classList.remove('active');
    }
    
    // 重新计算成本
    calculateErosionCost();
}

// 执行单次侵蚀
function performErosion(type) {
    console.log(`执行${type === 'dark' ? '暗黑' : '深渊'}侵蚀`);
    
    const erosionCount = document.getElementById('erosion-count');
    const totalErosionCost = document.getElementById('total-erosion-cost');
    
    if (!erosionCount || !totalErosionCost) return;
    
    // 获取当前计数
    let currentCount = parseInt(erosionCount.textContent) || 0;
    let currentCost = parseInt(totalErosionCost.textContent.replace(/[^\d]/g, '')) || 0;
    
    // 计算单次成本
    const singleCost = type === 'dark' ? 50 : 100;
    
    // 更新计数和成本
    currentCount += 1;
    currentCost += singleCost;
    
    erosionCount.textContent = currentCount;
    totalErosionCost.textContent = `${currentCost} 初火源质`;
    
    // 模拟成功率
    const successRate = type === 'dark' ? 0.1 : 0.05;
    const isSuccess = Math.random() < successRate;
    
    showNotification(
        `${type === 'dark' ? '暗黑' : '深渊'}侵蚀${isSuccess ? '成功' : '失败'}！`, 
        isSuccess ? 'success' : 'warning'
    );
}

// 执行多次侵蚀模拟
function performMultipleErosion(type) {
    console.log(`执行多次${type === 'dark' ? '暗黑' : '深渊'}侵蚀模拟`);
    
    const targetUpgradeCount = parseInt(document.getElementById('target-upgrade-count')?.value) || 1;
    const equipmentAffixCount = parseInt(document.getElementById('equipment-affix-count')?.value) || 4;
    
    // 基础成功率
    let successRate = type === 'dark' ? 0.1 : 0.05;
    successRate = successRate / equipmentAffixCount;
    
    const singleCost = type === 'dark' ? 50 : 100;
    let totalAttempts = 0;
    let successCount = 0;
    
    // 模拟直到达到目标成功次数
    while (successCount < targetUpgradeCount && totalAttempts < 10000) { // 防止无限循环
        totalAttempts++;
        if (Math.random() < successRate) {
            successCount++;
        }
    }
    
    const totalCost = totalAttempts * singleCost;
    
    // 更新显示
    const erosionCount = document.getElementById('erosion-count');
    const totalErosionCost = document.getElementById('total-erosion-cost');
    
    if (erosionCount) erosionCount.textContent = totalAttempts;
    if (totalErosionCost) totalErosionCost.textContent = `${totalCost} 初火源质`;
    
    // 显示结果
    const resultArea = document.getElementById('erosion-result-area');
    const resultContent = document.getElementById('erosion-result-content');
    
    if (resultArea && resultContent) {
        resultArea.style.display = 'block';
        resultContent.innerHTML = `
            <h4>侵蚀模拟结果</h4>
            <p><strong>侵蚀类型:</strong> ${type === 'dark' ? '暗黑侵蚀' : '深渊侵蚀'}</p>
            <p><strong>目标成功次数:</strong> ${targetUpgradeCount}</p>
            <p><strong>实际尝试次数:</strong> ${totalAttempts}</p>
            <p><strong>总成本:</strong> ${totalCost} 初火源质</p>
            <p><strong>平均每次成功成本:</strong> ${Math.round(totalCost / targetUpgradeCount)} 初火源质</p>
        `;
    }
    
    showNotification(`${type === 'dark' ? '暗黑' : '深渊'}侵蚀模拟完成！`, 'success');
}

// 设置打造事件监听器
function setupCraftingEventListeners() {
    console.log('设置装备打造事件监听器');
    
    // 装备打造成本计算按钮
    const calculateBtn = document.getElementById('calculate-crafting');
    if (calculateBtn) {
        calculateBtn.addEventListener('click', calculateCraftingCost);
    }
    
    // 装备打造重置按钮
    const craftingResetBtn = document.getElementById('crafting-reset-btn');
    if (craftingResetBtn) {
        craftingResetBtn.addEventListener('click', resetCraftingInputs);
    }

    // 打造模块：合并解梦与序列成本的复选框监听
    const includeDreamCheckbox = document.getElementById('include-dream-cost');
    if (includeDreamCheckbox) {
        includeDreamCheckbox.addEventListener('change', () => {
            const item = document.getElementById('dream-cost-item');
            if (item) item.style.display = includeDreamCheckbox.checked ? 'flex' : 'none';
            calculateCraftingCost();
        });
    }

    const includeSequenceCheckbox = document.getElementById('include-sequence-cost');
    if (includeSequenceCheckbox) {
        includeSequenceCheckbox.addEventListener('change', () => {
            const item = document.getElementById('sequence-cost-item');
            if (item) item.style.display = includeSequenceCheckbox.checked ? 'flex' : 'none';
            calculateCraftingCost();
        });
    }

    // 初始化可见状态
    const dreamItem = document.getElementById('dream-cost-item');
    const sequenceItem = document.getElementById('sequence-cost-item');
    if (dreamItem && includeDreamCheckbox) {
        dreamItem.style.display = includeDreamCheckbox.checked ? 'flex' : 'none';
    }
    if (sequenceItem && includeSequenceCheckbox) {
        sequenceItem.style.display = includeSequenceCheckbox.checked ? 'flex' : 'none';
    }
}

function resetCraftingInputs() {
    console.log('重置装备打造输入');
    // 重置装备打造相关的输入字段
    const craftingInputs = document.querySelectorAll('#crafting-module input, #crafting-module select');
    craftingInputs.forEach(input => {
        if (input.type === 'number' || input.type === 'text') {
            input.value = '';
        } else if (input.tagName === 'SELECT') {
            input.selectedIndex = 0;
        }
    });
    
    // 清空结果显示
    const craftingResult = document.getElementById('crafting-result');
    if (craftingResult) {
        craftingResult.innerHTML = '';
    }
}

// ==================== 追忆打造系统 ====================

// 追忆打造系统相关函数
let affixData = null;

// 加载词缀数据
async function loadAffixData() {
    if (affixData) return affixData;
    
    try {
        const response = await fetch('memory_affixes.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        affixData = await response.json();
        console.log('追忆词缀数据加载成功，共', affixData.length, '条词缀');
        return affixData;
    } catch (error) {
        console.error('加载追忆词缀数据失败:', error);
        showNotification('加载追忆词缀数据失败', 'error');
        return null;
    }
}

// 获取所有词缀列表
function getAllAffixes() {
    if (!affixData) {
        console.log('getAllAffixes: affixData为空');
        return [];
    }
    
    console.log('getAllAffixes: 开始处理追忆词缀数据，词缀数量:', affixData.length);
    
    const affixMap = new Map();
    let totalAffixCount = 0;
    let validAffixCount = 0;
    
    // 新的数据结构是直接的数组，每个元素包含词缀、T级、等级、权重
    affixData.forEach((affixItem, index) => {
        totalAffixCount++;
        // 检查词缀和权重字段
        if (affixItem.词缀 && affixItem.权重 && affixItem.权重 >= 1) {
            // 如果词缀已存在，保留权重较高的
            if (!affixMap.has(affixItem.词缀) || affixMap.get(affixItem.词缀).weight < affixItem.权重) {
                affixMap.set(affixItem.词缀, {
                    name: affixItem.词缀,
                    weight: affixItem.权重
                });
            }
            validAffixCount++;
        }
    });
    
    const result = Array.from(affixMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    console.log('getAllAffixes: 处理完成');
    console.log('- 总词缀数量:', totalAffixCount);
    console.log('- 有效词缀数量:', validAffixCount);
    console.log('- 去重后词缀数量:', result.length);
    console.log('- 前10个词缀:', result.slice(0, 10));
    
    return result;
}

// 搜索词缀
function searchAffixes(keyword) {
    if (!keyword) return [];
    
    const allAffixes = getAllAffixes();
    return allAffixes.filter(affix => 
        affix.name.toLowerCase().includes(keyword.toLowerCase())
    );
}

// 填充词缀选择器
function populateAffixSelect(selectId, affixes) {
    const selectElement = document.getElementById(selectId);
    if (!selectElement) return;
    
    // 清空现有选项
    selectElement.innerHTML = '<option value="">请选择词缀</option>';
    
    // 添加词缀选项
    affixes.forEach(affix => {
        const option = document.createElement('option');
        option.value = affix.name;
        option.textContent = affix.name;
        selectElement.appendChild(option);
    });
}

// 设置词缀搜索功能
function setupAffixSearch() {
    const affix1Search = document.getElementById('affix1-search');
    const affix2Search = document.getElementById('affix2-search');
    const targetAffix1 = document.getElementById('target-affix-1');
    const targetAffix2 = document.getElementById('target-affix-2');
    
    if (!affix1Search || !affix2Search || !targetAffix1 || !targetAffix2) {
        console.warn('词缀搜索DOM元素未找到');
        return;
    }
    
    // 初始化时填充所有可用的词缀
    const allAffixes = getAllAffixes();
    console.log('初始化词缀选择器，可用词缀数量:', allAffixes.length);
    populateAffixSelect('target-affix-1', allAffixes);
    populateAffixSelect('target-affix-2', allAffixes);
    
    if (affix1Search && targetAffix1) {
        affix1Search.addEventListener('input', function() {
            const keyword = this.value.trim();
            if (keyword.length >= 1) {
                const matchedAffixes = searchAffixes(keyword);
                populateAffixSelect('target-affix-1', matchedAffixes);
            } else {
                // 如果搜索框为空，显示所有词缀
                populateAffixSelect('target-affix-1', allAffixes);
            }
        });
    }
    
    if (affix2Search && targetAffix2) {
        affix2Search.addEventListener('input', function() {
            const keyword = this.value.trim();
            if (keyword.length >= 1) {
                const matchedAffixes = searchAffixes(keyword);
                populateAffixSelect('target-affix-2', matchedAffixes);
            } else {
                // 如果搜索框为空，显示所有词缀
                populateAffixSelect('target-affix-2', allAffixes);
            }
        });
    }
    
    console.log('词缀搜索功能设置完成');
}

// 计算追忆打造成本
function calculateMemoryCost() {
    console.log('开始计算追忆打造成本');
    
    // 获取输入值
    const memoryQuality = document.querySelector('input[name="memory-quality"]:checked')?.value || 'excellent';
    const currentLevel = parseInt(document.getElementById('current-level')?.value) || 1;
    const fragmentPrice = parseFloat(document.getElementById('fragment-price')?.value) || 0;
    const threadPrice = parseFloat(document.getElementById('thread-price')?.value) || 0;
    const targetAffix1Value = document.getElementById('target-affix-1')?.value || '';
    const targetAffix2Value = document.getElementById('target-affix-2')?.value || '';
    
    // 调试信息：输出获取到的目标词缀值
    console.log('获取到的目标词缀:', {
        targetAffix1Value: targetAffix1Value,
        targetAffix2Value: targetAffix2Value,
        affix1Element: document.getElementById('target-affix-1'),
        affix2Element: document.getElementById('target-affix-2')
    });
    
    // 检查目标词缀是否为空
    if (!targetAffix1Value && !targetAffix2Value) {
        console.log('目标词缀为空，停止计算');
        showNotification('请至少选择一个目标词缀', 'warning');
        return;
    }
    
    console.log('目标词缀验证通过，继续计算');
    
    // 调试信息：输出获取到的价格值
    console.log('获取到的材料价格:', {
        fragmentPrice: fragmentPrice,
        threadPrice: threadPrice,
        fragmentElement: document.getElementById('fragment-price'),
        threadElement: document.getElementById('thread-price'),
        fragmentValue: document.getElementById('fragment-price')?.value,
        threadValue: document.getElementById('thread-price')?.value
    });
    
    // 调试信息：输出计算过程中的价格使用
    console.log('价格使用情况:', {
        fragmentPrice: fragmentPrice,
        threadPrice: threadPrice,
        note: '强化成本和重构成本将在后续计算中使用这些价格'
    });
    
    // 根据品质自动计算目标等级（该品质能达到的最高等级）
    let targetLevel;
    if (memoryQuality === 'excellent') {
        targetLevel = 40; // 卓越品质最高40级
    } else if (memoryQuality === 'perfect') {
        targetLevel = 50; // 至臻品质最高50级
    } else {
        targetLevel = currentLevel; // 未知品质，默认不升级
    }
    
    // 验证输入
    if (!targetAffix1Value && !targetAffix2Value) {
        showNotification('请至少选择一个目标词缀', 'warning');
        return;
    }
    
    if (targetLevel <= currentLevel) {
        showNotification(`当前等级已达到${memoryQuality === 'excellent' ? '卓越' : '至臻'}品质的最高等级`, 'info');
        // 如果已经是最高等级，只计算重构成本
        targetLevel = currentLevel;
    }
    
    // 获取所有词缀数据
    const allAffixes = getAllAffixes();
    
    // 根据选择的词缀名称找到对应的词缀对象
    const targetAffix1 = targetAffix1Value ? allAffixes.find(affix => affix.name === targetAffix1Value) : null;
    const targetAffix2 = targetAffix2Value ? allAffixes.find(affix => affix.name === targetAffix2Value) : null;
    
    // 调试信息：输出找到的词缀对象
    console.log('找到的词缀对象:', {
        targetAffix1: targetAffix1,
        targetAffix2: targetAffix2,
        allAffixesCount: allAffixes.length,
        targetAffix1Value: targetAffix1Value,
        targetAffix2Value: targetAffix2Value
    });
    
    // 计算强化成本（基于等级和品质）
    const enhancementCosts = calculateEnhancementCost(memoryQuality, currentLevel, targetLevel);
    
    // 计算重构成本
    const reconstructionCosts = calculateReconstructionCost(memoryQuality, targetAffix1, targetAffix2, fragmentPrice, threadPrice);
    
    // 调试信息：输出重构成本计算结果
    console.log('重构成本计算结果:', {
        reconstructionCosts: reconstructionCosts,
        targetAffix1: targetAffix1,
        targetAffix2: targetAffix2,
        fragmentPrice: fragmentPrice,
        threadPrice: threadPrice
    });
    
    // 计算总成本
    const enhancementTotalCost = (enhancementCosts.fragmentCost * fragmentPrice) + (enhancementCosts.threadCost * threadPrice);
    const reconstructionTotalCost = reconstructionCosts.fragmentCost + reconstructionCosts.threadCost;
    const grandTotalCost = enhancementTotalCost + reconstructionTotalCost;
    
    // 更新显示
    updateMemoryResults({
        enhancementFragmentCost: enhancementCosts.fragmentCost,
        enhancementThreadCost: enhancementCosts.threadCost,
        enhancementTotalCost,
        reconstructionFragmentCost: reconstructionCosts.fragmentCount,
        reconstructionThreadCost: reconstructionCosts.threadCount,
        reconstructionFragmentCostPrice: reconstructionCosts.fragmentCost,
        reconstructionThreadCostPrice: reconstructionCosts.threadCost,
        reconstructionTotalCost,
        grandTotalCost,
        currentLevel,
        targetLevel,
        // 添加价格信息用于正确计算显示
        fragmentPrice,
        threadPrice
    });
    
    // 显示通知
    const levelInfo = targetLevel > currentLevel ? `升级到${targetLevel}级` : '无需升级';
    showNotification(`追忆打造成本计算完成！${levelInfo}`, 'success');
    
    // 保存材料价格
    const materials = {
        lingsha: parseFloat(document.getElementById('lingsha-price')?.value) || 0,
        zhengui: parseFloat(document.getElementById('zhengui-price')?.value) || 0,
        xishi: parseFloat(document.getElementById('xishi-price')?.value) || 0,
        zhizhen: parseFloat(document.getElementById('zhizhen-price')?.value) || 0,
        shensheng: parseFloat(document.getElementById('shensheng-price')?.value) || 0,
        dreamWeapon: parseFloat(document.getElementById('dream-weapon-price')?.value) || 0,
        dreamAccessory: parseFloat(document.getElementById('dream-accessory-price')?.value) || 0
    };
    saveMaterialPrices(materials);
    
    // 保存数据
    saveMemoryData();
}

// 计算强化成本
function calculateEnhancementCost(quality, currentLevel, targetLevel) {
    let totalFragmentCost = 0;
    let totalThreadCost = 0;
    
    // 根据品质和等级范围计算每级升级成本
    for (let level = currentLevel; level < targetLevel; level++) {
        const costs = getEnhancementCostPerLevel(quality, level);
        totalFragmentCost += costs.fragmentCost;
        totalThreadCost += costs.threadCost;
    }
    
    return {
        fragmentCost: totalFragmentCost,
        threadCost: totalThreadCost
    };
}

// 获取单级强化成本
function getEnhancementCostPerLevel(quality, level) {
    if (quality === 'excellent') {
        // 卓越品质强化规则
        if (level >= 1 && level < 10) {
            return { fragmentCost: 8, threadCost: 0 };
        } else if (level >= 10 && level < 19) {
            return { fragmentCost: 12, threadCost: 0 };
        } else if (level >= 19 && level < 20) {
            return { fragmentCost: 90, threadCost: 9 };
        } else if (level >= 20 && level < 29) {
            return { fragmentCost: 16, threadCost: 0 };
        } else if (level >= 29 && level < 30) {
            return { fragmentCost: 115, threadCost: 9 };
        } else if (level >= 30 && level < 39) {
            return { fragmentCost: 20, threadCost: 0 };
        } else if (level >= 39 && level < 40) {
            return { fragmentCost: 140, threadCost: 9 };
        }
    } else if (quality === 'perfect') {
        // 至臻品质强化规则
        if (level >= 1 && level < 10) {
            return { fragmentCost: 16, threadCost: 0 };
        } else if (level >= 10 && level < 19) {
            return { fragmentCost: 24, threadCost: 0 };
        } else if (level >= 19 && level < 20) {
            return { fragmentCost: 180, threadCost: 18 };
        } else if (level >= 20 && level < 29) {
            return { fragmentCost: 32, threadCost: 0 };
        } else if (level >= 29 && level < 30) {
            return { fragmentCost: 230, threadCost: 23 };
        } else if (level >= 30 && level < 39) {
            return { fragmentCost: 40, threadCost: 0 };
        } else if (level >= 39 && level < 40) {
            return { fragmentCost: 280, threadCost: 29 };
        } else if (level >= 40 && level < 49) {
            return { fragmentCost: 60, threadCost: 0 };
        } else if (level >= 49 && level < 50) {
            return { fragmentCost: 330, threadCost: 34 };
        }
    }
    
    // 默认返回0成本（超出范围或未知品质）
    return { fragmentCost: 0, threadCost: 0 };
}

// 计算重构成本
function calculateReconstructionCost(quality, targetAffix1, targetAffix2, fragmentPrice, threadPrice) {
    console.log('calculateReconstructionCost 被调用:', {
        quality: quality,
        targetAffix1: targetAffix1,
        targetAffix2: targetAffix2,
        fragmentPrice: fragmentPrice,
        threadPrice: threadPrice
    });
    
    // 获取单次重构的基础成本
    let baseCostPerReconstruction = {
        fragmentCost: 0,
        threadCost: 0
    };
    
    if (quality === 'excellent') {
        // 卓越：每次重构消耗 追忆碎絮*10 追忆游丝*1
        baseCostPerReconstruction.fragmentCost = 10;
        baseCostPerReconstruction.threadCost = 1;
    } else if (quality === 'perfect') {
        // 至臻：每次重构消耗 追忆碎絮*20 追忆游丝*2
        baseCostPerReconstruction.fragmentCost = 20;
        baseCostPerReconstruction.threadCost = 2;
    }
    
    console.log('基础重构成本:', baseCostPerReconstruction);
    
    let totalFragmentCount = 0;
    let totalThreadCount = 0;
    
    // 获取所有词缀数据来计算总权重
    const allAffixes = getAllAffixes();
    const totalWeight = allAffixes.reduce((sum, affix) => sum + affix.weight, 0);
    
    console.log('词缀权重信息:', {
        allAffixesCount: allAffixes.length,
        totalWeight: totalWeight,
        sampleAffixes: allAffixes.slice(0, 3)
    });
    
    // 计算目标词缀1的重构成本
    if (targetAffix1) {
        const affix1Weight = targetAffix1.weight || 1;
        const probability1 = affix1Weight / totalWeight;
        const expectedAttempts1 = 1 / probability1;
        
        totalFragmentCount += baseCostPerReconstruction.fragmentCost * expectedAttempts1;
        totalThreadCount += baseCostPerReconstruction.threadCost * expectedAttempts1;
        
        console.log('目标词缀1计算:', {
            affix: targetAffix1.name,
            weight: affix1Weight,
            probability: probability1,
            expectedAttempts: expectedAttempts1,
            fragmentCost: baseCostPerReconstruction.fragmentCost * expectedAttempts1,
            threadCost: baseCostPerReconstruction.threadCost * expectedAttempts1
        });
    }
    
    // 计算目标词缀2的重构成本
    if (targetAffix2) {
        const affix2Weight = targetAffix2.weight || 1;
        const probability2 = affix2Weight / totalWeight;
        const expectedAttempts2 = 1 / probability2;
        
        totalFragmentCount += baseCostPerReconstruction.fragmentCost * expectedAttempts2;
        totalThreadCount += baseCostPerReconstruction.threadCost * expectedAttempts2;
        
        console.log('目标词缀2计算:', {
            affix: targetAffix2.name,
            weight: affix2Weight,
            probability: probability2,
            expectedAttempts: expectedAttempts2,
            fragmentCost: baseCostPerReconstruction.fragmentCost * expectedAttempts2,
            threadCost: baseCostPerReconstruction.threadCost * expectedAttempts2
        });
    }
    
    // 计算总价格（材料数量 * 单价）
    const totalFragmentCost = totalFragmentCount * fragmentPrice;
    const totalThreadCost = totalThreadCount * threadPrice;
    
    const result = {
        fragmentCost: totalFragmentCost,
        threadCost: totalThreadCost,
        fragmentCount: totalFragmentCount,
        threadCount: totalThreadCount
    };
    
    console.log('重构成本计算最终结果:', result);
    
    return result;
}

// 更新追忆打造结果显示
function updateMemoryResults(results) {
    const elements = {
        enhancementFragmentCost: document.getElementById('enhancement-fragment-cost'),
        enhancementThreadCost: document.getElementById('enhancement-thread-cost'),
        enhancementTotalCost: document.getElementById('enhancement-total-cost'),
        reconstructionFragmentCost: document.getElementById('reconstruction-fragment-cost'),
        reconstructionThreadCost: document.getElementById('reconstruction-thread-cost'),
        reconstructionTotalCost: document.getElementById('reconstruction-total-cost'),
        grandTotalCost: document.getElementById('grand-total-cost')
    };
    
    // 获取价格信息
    const fragmentPrice = results.fragmentPrice || 0;
    const threadPrice = results.threadPrice || 0;
    
    // 计算强化成本（材料数量 * 单价）
    const enhancementFragmentCost = (results.enhancementFragmentCost || 0) * fragmentPrice;
    const enhancementThreadCost = (results.enhancementThreadCost || 0) * threadPrice;
    const enhancementTotal = enhancementFragmentCost + enhancementThreadCost;
    
    // 重构成本已经在calculateReconstructionCost中计算了价格
    const reconstructionTotal = (results.reconstructionTotalCost || 0);
    
    // 总成本
    const grandTotal = enhancementTotal + reconstructionTotal;
    
    // 更新升级成本显示（显示材料数量）
    if (elements.enhancementFragmentCost) {
        elements.enhancementFragmentCost.textContent = Math.round(results.enhancementFragmentCost || 0).toLocaleString();
    }
    if (elements.enhancementThreadCost) {
        elements.enhancementThreadCost.textContent = Math.round(results.enhancementThreadCost || 0).toLocaleString();
    }
    if (elements.enhancementTotalCost) {
        elements.enhancementTotalCost.textContent = Math.round(enhancementTotal).toLocaleString();
    }
    
    // 更新重构成本显示（显示材料数量）
    if (elements.reconstructionFragmentCost) {
        elements.reconstructionFragmentCost.textContent = Math.round(results.reconstructionFragmentCost || 0).toLocaleString();
    }
    if (elements.reconstructionThreadCost) {
        elements.reconstructionThreadCost.textContent = Math.round(results.reconstructionThreadCost || 0).toLocaleString();
    }
    if (elements.reconstructionTotalCost) {
        elements.reconstructionTotalCost.textContent = Math.round(reconstructionTotal).toLocaleString();
    }
    
    // 更新总成本
    if (elements.grandTotalCost) {
        elements.grandTotalCost.textContent = Math.round(grandTotal).toLocaleString();
    }
    
    // 调试信息
    console.log('结果显示更新:', {
        enhancementFragmentCount: results.enhancementFragmentCost,
        enhancementThreadCount: results.enhancementThreadCost,
        enhancementFragmentCost: enhancementFragmentCost,
        enhancementThreadCost: enhancementThreadCost,
        enhancementTotal: enhancementTotal,
        reconstructionFragmentCount: results.reconstructionFragmentCost,
        reconstructionThreadCount: results.reconstructionThreadCost,
        reconstructionFragmentCostPrice: results.reconstructionFragmentCostPrice,
        reconstructionThreadCostPrice: results.reconstructionThreadCostPrice,
        reconstructionTotal: reconstructionTotal,
        grandTotal: grandTotal,
        fragmentPrice: fragmentPrice,
        threadPrice: threadPrice
    });
}

// 保存追忆打造数据
function saveMemoryData() {
    try {
        const data = {
            memoryQuality: document.querySelector('input[name="memory-quality"]:checked')?.value || 'excellent',
            currentLevel: document.getElementById('current-level')?.value || '1',
            fragmentPrice: document.getElementById('fragment-price')?.value || '0',
            threadPrice: document.getElementById('thread-price')?.value || '0',
            targetAffix1: document.getElementById('target-affix-1')?.value || '',
            targetAffix2: document.getElementById('target-affix-2')?.value || '',
            affix1Search: document.getElementById('affix1-search')?.value || '',
            affix2Search: document.getElementById('affix2-search')?.value || ''
        };
        
        localStorage.setItem('memoryData', JSON.stringify(data));
        console.log('追忆打造数据已保存');
    } catch (error) {
        console.error('保存追忆打造数据失败:', error);
    }
}

// 加载追忆打造数据
function loadMemoryData() {
    try {
        const savedData = localStorage.getItem('memoryData');
        if (!savedData) return;
        
        const data = JSON.parse(savedData);
        
        // 恢复品质选择
        if (data.memoryQuality) {
            const qualityRadio = document.querySelector(`input[name="memory-quality"][value="${data.memoryQuality}"]`);
            if (qualityRadio) qualityRadio.checked = true;
        }
        
        // 恢复其他输入值
        const inputs = [
            'current-level', 'fragment-price', 'thread-price', 
            'target-affix-1', 'target-affix-2', 'affix1-search', 'affix2-search'
        ];
        
        inputs.forEach(inputId => {
            const element = document.getElementById(inputId);
            // 处理键名映射：保存时使用的键名与DOM元素ID不同
            let dataKey = inputId;
            if (inputId === 'fragment-price') dataKey = 'fragmentPrice';
            if (inputId === 'thread-price') dataKey = 'threadPrice';
            if (inputId === 'target-affix-1') dataKey = 'targetAffix1';
            if (inputId === 'target-affix-2') dataKey = 'targetAffix2';
            
            if (element && data[dataKey]) {
                element.value = data[dataKey];
            }
        });
        
        // 加载保存的材料价格
        const savedPrices = localStorage.getItem('memory-material-prices');
        if (savedPrices) {
            const prices = JSON.parse(savedPrices);
            if (prices.fragmentPrice !== undefined) {
                const fragmentElement = document.getElementById('fragment-price');
                if (fragmentElement) fragmentElement.value = prices.fragmentPrice;
            }
            if (prices.threadPrice !== undefined) {
                const threadElement = document.getElementById('thread-price');
                if (threadElement) threadElement.value = prices.threadPrice;
            }
        }
        
        console.log('追忆打造数据已加载');
    } catch (error) {
        console.error('加载追忆打造数据失败:', error);
    }
}

// 初始化追忆打造系统
async function initializeMemoryCrafting() {
    console.log('初始化追忆打造系统');
    
    try {
        // 加载词缀数据
        await loadAffixData();
        
        // 检查词缀数据是否加载成功
        if (affixData) {
            console.log('词缀数据加载成功，数据长度:', affixData.length);
            console.log('词缀数据示例:', affixData[0]);
        } else {
            console.error('词缀数据加载失败');
        }
        
        // 确保DOM元素存在后再设置功能
        const affix1Search = document.getElementById('affix1-search');
        const affix2Search = document.getElementById('affix2-search');
        const targetAffix1 = document.getElementById('target-affix-1');
        const targetAffix2 = document.getElementById('target-affix-2');
        
        if (!affix1Search || !affix2Search || !targetAffix1 || !targetAffix2) {
            console.warn('追忆打造系统DOM元素未找到，延迟初始化');
            setTimeout(() => initializeMemoryCrafting(), 500);
            return;
        }
        
        // 设置词缀搜索功能
        setupAffixSearch();
        
        // 加载保存的数据
        loadMemoryData();
        
        // 设置自动保存
        const memoryInputs = document.querySelectorAll('#memory-crafting input, #memory-crafting select');
        memoryInputs.forEach(input => {
            input.addEventListener('change', saveMemoryData);
        });
        
        console.log('追忆打造系统初始化完成');
    } catch (error) {
        console.error('追忆打造系统初始化失败:', error);
    }
}