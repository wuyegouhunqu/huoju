// 全局变量
let currentTab = 'crafting';

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// 初始化应用
function initializeApp() {
    setupTabNavigation();
    setupFormValidation();
    setupAnimations();
    fixImagePaths();
    initializeDreamSystem();
    initializeSkillSystem();
    initializeSealSystem();
    initializeTowerSystem();
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

function initializeSkillSystem() {
    const currentLevelSelect = document.getElementById('current-level');
    const targetLevelSelect = document.getElementById('target-level');
    
    // 当前等级变化时更新目标等级选项
    currentLevelSelect.addEventListener('change', function() {
        const currentLevel = parseInt(this.value);
        targetLevelSelect.innerHTML = '';
        
        for (let i = currentLevel + 1; i <= 5; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i + '级';
            targetLevelSelect.appendChild(option);
        }
    });
    
    // 初始化目标等级选项
    currentLevelSelect.dispatchEvent(new Event('change'));
    
    // 添加数量输入框的滚轮事件
    ['t0-quantity', 't1-quantity', 't2-quantity'].forEach(id => {
        const input = document.getElementById(id);
        input.addEventListener('wheel', function(e) {
            e.preventDefault();
            const currentValue = parseInt(this.value) || 0;
            const delta = e.deltaY > 0 ? -1 : 1;
            const newValue = Math.max(0, currentValue + delta);
            this.value = newValue;
            
            // 触发计算更新
            calculateSkillUpgrade();
        });
    });
    
    // 添加输入变化事件监听
    ['current-level', 'target-level', 'inspiration-price', 't0-quantity', 't0-price', 't1-quantity', 't1-price', 't2-quantity', 't2-price'].forEach(id => {
        const element = document.getElementById(id);
        element.addEventListener('change', calculateSkillUpgrade);
        element.addEventListener('input', calculateSkillUpgrade);
    });
}

function calculateSkillUpgrade() {
    const currentLevel = parseInt(document.getElementById('current-level').value);
    const targetLevel = parseInt(document.getElementById('target-level').value);
    const inspirationPrice = parseFloat(document.getElementById('inspiration-price').value) || 0;
    
    const t0Quantity = parseInt(document.getElementById('t0-quantity').value) || 0;
    const t0Price = parseFloat(document.getElementById('t0-price').value) || 0;
    const t1Quantity = parseInt(document.getElementById('t1-quantity').value) || 0;
    const t1Price = parseFloat(document.getElementById('t1-price').value) || 0;
    const t2Quantity = parseInt(document.getElementById('t2-quantity').value) || 0;
    const t2Price = parseFloat(document.getElementById('t2-price').value) || 0;
    
    if (!targetLevel || targetLevel <= currentLevel) {
        // 重置显示
        document.getElementById('total-exp-needed').textContent = '0';
        document.getElementById('current-exp-provided').textContent = '0';
        document.getElementById('inspiration-needed').textContent = '0';
        document.getElementById('total-cost').textContent = '0 初火源质';
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
    document.getElementById('total-exp-needed').textContent = totalExpNeeded;
    document.getElementById('current-exp-provided').textContent = currentExpProvided;
    document.getElementById('inspiration-needed').textContent = totalInspirationNeeded;
    document.getElementById('total-cost').textContent = totalCost.toFixed(2) + ' 初火源质';
    
    // 如果经验不足，显示警告颜色
    const expProvidedElement = document.getElementById('current-exp-provided');
    if (currentExpProvided < totalExpNeeded) {
        expProvidedElement.style.color = '#ff6b6b';
    } else {
        expProvidedElement.style.color = '#4a9eff';
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
            targetTab.style.opacity = '0';
            targetTab.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                targetTab.style.transition = 'all 0.5s ease';
                targetTab.style.opacity = '1';
                targetTab.style.transform = 'translateY(0)';
            }, 50);
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
            this.parentElement.style.transform = 'translateY(-2px)';
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.style.transform = 'translateY(0)';
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
        const weaponType = document.querySelector('input[name="weapon-type"]:checked').value;
        const equipmentLevel = document.querySelector('input[name="equipment-level"]:checked').value;
        
        // 获取词缀选择
        const affixes = {
            basic: parseInt(document.querySelector('.affix-category:nth-child(1) .affix-row:nth-child(2) select').value) || 0,
            basicT0: parseInt(document.querySelector('.affix-category:nth-child(1) .affix-row:nth-child(3) select').value) || 0,
            basicUpgrade: parseInt(document.querySelector('.affix-category:nth-child(1) .affix-row:nth-child(4) select').value) || 0,
            advanced: parseInt(document.querySelector('.affix-category:nth-child(2) .affix-row:nth-child(2) select').value) || 0,
            advancedT0: parseInt(document.querySelector('.affix-category:nth-child(2) .affix-row:nth-child(3) select').value) || 0,
            advancedUpgrade: parseInt(document.querySelector('.affix-category:nth-child(2) .affix-row:nth-child(4) select').value) || 0,
            perfect: parseInt(document.querySelector('.affix-category:nth-child(3) .affix-row:nth-child(2) select').value) || 0,
            perfectT0: parseInt(document.querySelector('.affix-category:nth-child(3) .affix-row:nth-child(3) select').value) || 0,
            perfectUpgrade: parseInt(document.querySelector('.affix-category:nth-child(3) .affix-row:nth-child(4) select').value) || 0
        };
        
        // 获取材料价格
        const materials = {
            lingsha: parseFloat(document.getElementById('lingsha-price').value) || 0,
            chuhuo: 1, // 初火源质恒定为1，不需要输入框
            zhengui: parseFloat(document.getElementById('zhengui-price').value) || 0,
            xishi: parseFloat(document.getElementById('xishi-price').value) || 0,
            zhizhen: parseFloat(document.getElementById('zhizhen-price').value) || 0,
            shensheng: parseFloat(document.getElementById('shensheng-price').value) || 0
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
        const levelData = craftingData[equipmentLevel][weaponType];
        
        // 计算各种词缀的成本
        const affixTypes = [
            { count: affixes.basic, type: 'basic' },
            { count: affixes.basicT0, type: 'basic' }, // T0使用相同配置
            { count: affixes.basicUpgrade, type: 'basicUpgrade' },
            { count: affixes.advanced, type: 'advanced' },
            { count: affixes.advancedT0, type: 'advanced' }, // T0使用相同配置
            { count: affixes.advancedUpgrade, type: 'advancedUpgrade' },
            { count: affixes.perfect, type: 'perfect' },
            { count: affixes.perfectT0, type: 'perfect' }, // T0使用相同配置
            { count: affixes.perfectUpgrade, type: 'perfectUpgrade' }
        ];
        
        affixTypes.forEach(affix => {
            if (affix.count > 0 && levelData[affix.type]) {
                const config = levelData[affix.type];
                let singleCost = 0;
                
                // 计算单次打造材料成本
                Object.keys(config.materials).forEach(materialKey => {
                    const materialCount = config.materials[materialKey];
                    const materialPrice = materials[materialKey];
                    singleCost += materialCount * materialPrice;
                });
                
                // 根据成功率计算期望成本
                const expectedCost = singleCost / config.successRate;
                totalCost += expectedCost * affix.count;
            }
        });
        
        // 显示结果
        const resultElement = document.getElementById('crafting-result');
        resultElement.textContent = `${totalCost.toFixed(2)} 初火源质`;
        
        // 添加结果动画
        resultElement.style.transform = 'scale(1.1)';
        resultElement.style.color = '#ff6b6b';
        setTimeout(() => {
            resultElement.style.transform = 'scale(1)';
        }, 300);
        
        // 显示成功提示
        showNotification('计算完成！', 'success');
        
        // 保存材料价格到本地存储
        saveMaterialPrices(materials);
        
    } catch (error) {
        console.error('计算错误:', error);
        showNotification('计算出错，请检查输入数据', 'error');
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
         shensheng: materials.shensheng
     };
     localStorage.setItem('torchlight-material-prices', JSON.stringify(pricesForSave));
 }
 
 // 加载材料价格
 function loadMaterialPrices() {
     const saved = localStorage.getItem('torchlight-material-prices');
     if (saved) {
         const materials = JSON.parse(saved);
         document.getElementById('lingsha-price').value = materials.lingsha || '';
         document.getElementById('zhengui-price').value = materials.zhengui || '';
         document.getElementById('xishi-price').value = materials.xishi || '';
         document.getElementById('zhizhen-price').value = materials.zhizhen || '';
         document.getElementById('shensheng-price').value = materials.shensheng || '';
     }
 }

// 页面加载时恢复材料价格
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(loadMaterialPrices, 100);
});

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
            const method = row.querySelector('.dr-method').value;
            const layers = parseInt(row.querySelector('.dr-layers').value) || 0;
            const percent = parseFloat(row.querySelector('.dr-percent').value) || 0;
            
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
        
        showNotification('减伤计算完成！', 'success');
        
    } catch (error) {
        console.error('减伤计算错误:', error);
        showNotification('减伤计算出错，请检查输入数据', 'error');
    }
}

// 叠乘增伤计算函数
function calculateMultiplyDamage() {
    try {
        const singleIncrease = parseFloat(document.getElementById('single-damage-increase').value) || 0;
        const multiplyTimes = parseInt(document.getElementById('multiply-times').value) || 0;
        
        if (singleIncrease <= 0 || multiplyTimes <= 0) {
            showNotification('请输入有效的增伤数值和叠乘次数', 'warning');
            return;
        }
        
        // 叠乘增伤计算：(1 + 单次增伤%)^叠乘次数 - 1
        const totalIncrease = Math.pow(1 + singleIncrease / 100, multiplyTimes) - 1;
        const totalIncreasePercent = totalIncrease * 100;
        
        // 显示结果
        const resultElement = document.getElementById('multiply-result');
        resultElement.textContent = `总增伤：${totalIncreasePercent.toFixed(2)}%`;
        
        // 添加结果动画
        resultElement.style.transform = 'scale(1.1)';
        setTimeout(() => {
            resultElement.style.transform = 'scale(1)';
        }, 300);
        
        showNotification('增伤计算完成！', 'success');
        
    } catch (error) {
        console.error('增伤计算错误:', error);
        showNotification('增伤计算出错，请检查输入数据', 'error');
    }
}

// 伤害提升计算函数
function calculateDamageImprovement() {
    try {
        const damageBefore = parseFloat(document.getElementById('damage-before').value) || 0;
        const damageAfter = parseFloat(document.getElementById('damage-after').value) || 0;
        
        if (damageBefore <= 0 || damageAfter <= 0) {
            showNotification('请输入有效的伤害数值', 'warning');
            return;
        }
        
        if (damageAfter <= damageBefore) {
            showNotification('提升后伤害应大于提升前伤害', 'warning');
            return;
        }
        
        // 伤害提升百分比计算：(提升后 - 提升前) / 提升前 * 100%
        const improvement = ((damageAfter - damageBefore) / damageBefore) * 100;
        
        // 显示结果
        const resultElement = document.getElementById('improvement-result');
        resultElement.textContent = `伤害提升：${improvement.toFixed(2)}%`;
        
        // 添加结果动画
        resultElement.style.transform = 'scale(1.1)';
        setTimeout(() => {
            resultElement.style.transform = 'scale(1)';
        }, 300);
        
        showNotification('伤害提升计算完成！', 'success');
        
    } catch (error) {
        console.error('伤害提升计算错误:', error);
        showNotification('伤害提升计算出错，请检查输入数据', 'error');
    }
}

// 解梦系统数据
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
            // 单手武器
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
            // 双手武器
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
        { name: '+(54–74) 最大生命', weight: 61 },
        { name: '+(87–117) 最大护盾', weight: 61 },
        { name: '+(5–10)% 火焰抗性', weight: 61 },
        { name: '+(5–10)% 冰冷抗性', weight: 61 },
        { name: '+(5–10)% 闪电抗性', weight: 61 },
        { name: '+(5–10)% 腐蚀抗性', weight: 61 },
        { name: '+(15–20) 力量', weight: 61 },
        { name: '+(15–20) 敏捷', weight: 61 },
        { name: '+(15–20) 智慧', weight: 61 },
        { name: '+(6–8)% 攻击和施法速度', weight: 61 },
        { name: '+(11–15)% 移动速度', weight: 13 },
        { name: '使用轰炸技能时， +(50–66)% 几率 +1 轰炸技能总波次', weight: 13 },
        { name: '+(15–20)% 战意效果', weight: 13 },
        { name: '+1 坚韧祝福层数上限', weight: 1 },
        { name: '+1 灵动祝福层数上限', weight: 1 },
        { name: '+1 聚能祝福层数上限', weight: 1 },
        { name: '造成伤害时，触发 20 级盲目诅咒，冷却时间为 0.2 秒', weight: 1 },
        { name: '造成伤害时，触发 20 级胆怯诅咒，冷却时间为 0.2 秒', weight: 1 },
        { name: '造成伤害时，触发 20 级苦痛纠缠诅咒，冷却时间为 0.2 秒', weight: 1 },
        { name: '造成伤害时，触发 20 级冰寒之触诅咒，冷却时间为 0.2 秒', weight: 0 },
        { name: '附加 (18–20)% 物理伤害的火焰伤害', weight: 13 },
        { name: '附加 (18–20)% 物理伤害的冰冷伤害', weight: 13 },
        { name: '附加 (18–20)% 物理伤害的闪电伤害', weight: 13 },
        { name: '附加 (18–20)% 物理伤害的腐蚀伤害', weight: 13 }
    ],
    necklace: [
        { name: '+(54–74) 最大生命', weight: 46 },
        { name: '+(87–117) 最大护盾', weight: 46 },
        { name: '+(5–10)% 火焰抗性', weight: 46 },
        { name: '+(5–10)% 冰冷抗性', weight: 46 },
        { name: '+(5–10)% 闪电抗性', weight: 46 },
        { name: '+(5–10)% 腐蚀抗性', weight: 46 },
        { name: '+(3–4)% 元素抗性', weight: 46 },
        { name: '+(15–20) 力量', weight: 46 },
        { name: '+(15–20) 敏捷', weight: 46 },
        { name: '+(15–20) 智慧', weight: 46 },
        { name: '+(20–24)% 伤害 (20–24)% 召唤物伤害', weight: 46 },
        { name: '+(11–15)% 移动速度', weight: 15 },
        { name: '每拥有 1 层任意祝福， +(2–3)% 伤害', weight: 15 },
        { name: '每 27 点属性， +1% 伤害', weight: 15 },
        { name: '附加 10 异常基础伤害', weight: 15 },
        { name: '+(6–8)% 魔力封印补偿', weight: 15 },
        { name: '造成伤害时，触发 20 级易伤诅咒，冷却时间为 0.2 秒', weight: 1 },
        { name: '造成伤害时，触发 20 级炽热诅咒，冷却时间为 0.2 秒', weight: 1 },
        { name: '造成伤害时，触发 20 级蚀骨之寒诅咒，冷却时间为 0.2 秒', weight: 1 },
        { name: '造成伤害时，触发 20 级感电诅咒，冷却时间为 0.2 秒', weight: 1 },
        { name: '造成伤害时，触发 20 级邪恶侵蚀诅咒，冷却时间为 0.2 秒', weight: 1 }
    ],
    belt: [
        { name: '+(54–74) 最大生命', weight: 4 },
        { name: '+(40–60) 最大魔力', weight: 4 },
        { name: '+(87–117) 最大护盾', weight: 4 },
        { name: '+(5–10)% 火焰抗性', weight: 4 },
        { name: '+(5–10)% 冰冷抗性', weight: 4 },
        { name: '+(5–10)% 闪电抗性', weight: 4 },
        { name: '+(5–10)% 腐蚀抗性', weight: 4 },
        { name: '+(15–20) 力量', weight: 4 },
        { name: '+(15–20) 敏捷', weight: 4 },
        { name: '+(15–20) 智慧', weight: 4 },
        { name: '+(11–15)% 移动速度', weight: 1 },
        { name: '使用轰炸技能时， +(50–66)% 几率 +1 轰炸技能总波次', weight: 1 },
        { name: '+(8–10)% 冷却回复速度', weight: 1 },
        { name: '+(8–10)% 技能效果持续时间', weight: 1 },
        { name: '+(6–8)% 魔力封印补偿', weight: 1 },
        { name: '+(7–8)% 光环效果', weight: 1 }
    ]
};

// 武器词缀数据
const weaponAffixes = {
    // 单手武器词缀 (权重30/11/1)
    claw: [
        { name: '攻击附加 (10–15) - (14–19) 点物理伤害', weight: 30 },
        { name: '攻击附加 (9–14) - (15–20) 点火焰伤害', weight: 30 },
        { name: '攻击附加 (10–15) - (14–19) 点冰冷伤害', weight: 30 },
        { name: '攻击附加 (1–2) - (28–32) 点闪电伤害', weight: 30 },
        { name: '攻击附加 (11–16) - (13–18) 点腐蚀伤害', weight: 30 },
        { name: '+(20–24)% 物理伤害', weight: 30 },
        { name: '+(20–24)% 元素伤害', weight: 30 },
        { name: '+(20–24)% 腐蚀伤害', weight: 30 },
        { name: '+(20–24)% 近战伤害', weight: 30 },
        { name: '+(6–8)% 攻击速度', weight: 30 },
        { name: '+1 幻影数量', weight: 11 },
        { name: '额外 +(6–8)% 攻击伤害', weight: 11 },
        { name: '+(6–8)% 元素和腐蚀抗性穿透', weight: 11 },
        { name: '+(5–7)% 护甲减伤穿透', weight: 11 },
        { name: '+1 坚韧祝福层数上限', weight: 1 },
        { name: '+1 灵动祝福层数上限', weight: 1 },
        { name: '+1 聚能祝福层数上限', weight: 1 }
    ],
    dagger: [
        { name: '攻击附加 (10–15) - (14–19) 点物理伤害', weight: 30 },
        { name: '攻击附加 (9–14) - (15–20) 点火焰伤害', weight: 30 },
        { name: '攻击附加 (10–15) - (14–19) 点冰冷伤害', weight: 30 },
        { name: '攻击附加 (1–2) - (28–32) 点闪电伤害', weight: 30 },
        { name: '攻击附加 (11–16) - (13–18) 点腐蚀伤害', weight: 30 },
        { name: '+(20–24)% 物理伤害', weight: 30 },
        { name: '+(20–24)% 元素伤害', weight: 30 },
        { name: '+(20–24)% 腐蚀伤害', weight: 30 },
        { name: '+(20–24)% 近战伤害', weight: 30 },
        { name: '+(6–8)% 攻击速度', weight: 30 },
        { name: '+1 幻影数量', weight: 11 },
        { name: '额外 +(6–8)% 攻击伤害', weight: 11 },
        { name: '+(6–8)% 元素和腐蚀抗性穿透', weight: 11 },
        { name: '+(5–7)% 护甲减伤穿透', weight: 11 },
        { name: '+1 坚韧祝福层数上限', weight: 1 },
        { name: '+1 灵动祝福层数上限', weight: 1 },
        { name: '+1 聚能祝福层数上限', weight: 1 }
    ],
    pistol: [
        { name: '攻击附加 (10–15) - (14–19) 点物理伤害', weight: 42 },
        { name: '攻击附加 (9–14) - (15–20) 点火焰伤害', weight: 42 },
        { name: '攻击附加 (10–15) - (14–19) 点冰冷伤害', weight: 42 },
        { name: '攻击附加 (1–2) - (28–32) 点闪电伤害', weight: 42 },
        { name: '攻击附加 (11–16) - (13–18) 点腐蚀伤害', weight: 42 },
        { name: '+(20–24)% 物理伤害', weight: 42 },
        { name: '+(20–24)% 元素伤害', weight: 42 },
        { name: '+(20–24)% 腐蚀伤害', weight: 42 },
        { name: '+(20–24)% 远程伤害', weight: 42 },
        { name: '+(6–8)% 攻击速度', weight: 42 },
        { name: '+1 投射物数量', weight: 10 },
        { name: '+1 抛射投射物分裂数量', weight: 10 },
        { name: '+(6–8)% 元素和腐蚀抗性穿透', weight: 10 },
        { name: '+(5–7)% 护甲减伤穿透', weight: 10 },
        { name: '+1 坚韧祝福层数上限', weight: 1 },
        { name: '+1 灵动祝福层数上限', weight: 1 },
        { name: '+1 聚能祝福层数上限', weight: 1 },
        { name: '+(24–32)% 该装备物理伤害', weight: 10 },
        { name: '该装备附加 (32–34) - (40–42) 点物理伤害', weight: 10 },
        { name: '暴击幸运 +(60–75) 暴击值', weight: 1 }
    ],
    // 其他单手武器 (权重30/11/1)
    one_hand_sword: [
        { name: '攻击附加 (10–15) - (14–19) 点物理伤害', weight: 30 },
        { name: '攻击附加 (9–14) - (15–20) 点火焰伤害', weight: 30 },
        { name: '攻击附加 (10–15) - (14–19) 点冰冷伤害', weight: 30 },
        { name: '攻击附加 (1–2) - (28–32) 点闪电伤害', weight: 30 },
        { name: '攻击附加 (11–16) - (13–18) 点腐蚀伤害', weight: 30 },
        { name: '+(20–24)% 物理伤害', weight: 30 },
        { name: '+(20–24)% 元素伤害', weight: 30 },
        { name: '+(20–24)% 腐蚀伤害', weight: 30 },
        { name: '+(20–24)% 近战伤害', weight: 30 },
        { name: '+(6–8)% 攻击速度', weight: 30 },
        { name: '+(26–32)% 连续攻击几率', weight: 11 },
        { name: '连续攻击伤害递增 (10–16)%', weight: 11 },
        { name: '+(6–8)% 元素和腐蚀抗性穿透', weight: 11 },
        { name: '+(5–7)% 护甲减伤穿透', weight: 11 },
        { name: '+1 坚韧祝福层数上限', weight: 1 },
        { name: '+1 灵动祝福层数上限', weight: 1 },
        { name: '+1 聚能祝福层数上限', weight: 1 }
    ],
    one_hand_hammer: [
        { name: '攻击附加 (10–15) - (14–19) 点物理伤害', weight: 30 },
        { name: '攻击附加 (9–14) - (15–20) 点火焰伤害', weight: 30 },
        { name: '攻击附加 (10–15) - (14–19) 点冰冷伤害', weight: 30 },
        { name: '攻击附加 (1–2) - (28–32) 点闪电伤害', weight: 30 },
        { name: '攻击附加 (11–16) - (13–18) 点腐蚀伤害', weight: 30 },
        { name: '+(20–24)% 物理伤害', weight: 30 },
        { name: '+(20–24)% 元素伤害', weight: 30 },
        { name: '+(20–24)% 腐蚀伤害', weight: 30 },
        { name: '+(20–24)% 近战伤害', weight: 30 },
        { name: '+(6–8)% 攻击速度', weight: 30 },
        { name: '消耗破击蓄能时，该次技能额外 +(12–16)% 伤害', weight: 11 },
        { name: '造成伤害时，淘汰生命值低于 (5–7)% 的敌人', weight: 11 },
        { name: '+(6–8)% 元素和腐蚀抗性穿透', weight: 11 },
        { name: '+(5–7)% 护甲减伤穿透', weight: 11 },
        { name: '+1 坚韧祝福层数上限', weight: 1 },
        { name: '+1 灵动祝福层数上限', weight: 1 },
        { name: '+1 聚能祝福层数上限', weight: 1 }
    ],
    one_hand_axe: [
        { name: '攻击附加 (10–15) - (14–19) 点物理伤害', weight: 30 },
        { name: '攻击附加 (9–14) - (15–20) 点火焰伤害', weight: 30 },
        { name: '攻击附加 (10–15) - (14–19) 点冰冷伤害', weight: 30 },
        { name: '攻击附加 (1–2) - (28–32) 点闪电伤害', weight: 30 },
        { name: '攻击附加 (11–16) - (13–18) 点腐蚀伤害', weight: 30 },
        { name: '+(20–24)% 物理伤害', weight: 30 },
        { name: '+(20–24)% 元素伤害', weight: 30 },
        { name: '+(20–24)% 腐蚀伤害', weight: 30 },
        { name: '+(20–24)% 近战伤害', weight: 30 },
        { name: '+(6–8)% 攻击速度', weight: 30 },
        { name: '对创伤状态下的敌人，额外 +(6–8)% 伤害', weight: 11 },
        { name: '额外 +(6–9)% 斩击伤害', weight: 11 },
        { name: '+(6–8)% 元素和腐蚀抗性穿透', weight: 11 },
        { name: '+(5–7)% 护甲减伤穿透', weight: 11 },
        { name: '+1 坚韧祝福层数上限', weight: 1 },
        { name: '+1 灵动祝福层数上限', weight: 1 },
        { name: '+1 聚能祝福层数上限', weight: 1 }
    ],
    staff: [
        { name: '法术附加 (10–15) - (14–19) 点物理伤害', weight: 30 },
        { name: '法术附加 (9–14) - (15–20) 点火焰伤害', weight: 30 },
        { name: '法术附加 (10–15) - (14–19) 点冰冷伤害', weight: 30 },
        { name: '法术附加 (1–2) - (28–32) 点闪电伤害', weight: 30 },
        { name: '法术附加 (11–16) - (13–18) 点腐蚀伤害', weight: 30 },
        { name: '+(20–24)% 物理伤害', weight: 30 },
        { name: '+(20–24)% 元素伤害', weight: 30 },
        { name: '+(20–24)% 腐蚀伤害', weight: 30 },
        { name: '+(20–24)% 法术伤害', weight: 30 },
        { name: '+(6–8)% 施法速度', weight: 30 },
        { name: '+1 投射物数量', weight: 11 },
        { name: '+1 抛射投射物分裂数量', weight: 11 },
        { name: '+(6–8)% 元素和腐蚀抗性穿透', weight: 11 },
        { name: '+(5–7)% 护甲减伤穿透', weight: 11 },
        { name: '+1 坚韧祝福层数上限', weight: 1 },
        { name: '+1 灵动祝福层数上限', weight: 1 },
        { name: '+1 聚能祝福层数上限', weight: 1 }
    ],
    // 双手武器 (权重50/12/1 或 42/10/1)
    two_hand_sword: [
        { name: '攻击附加 (10–15) - (14–19) 点物理伤害', weight: 42 },
        { name: '攻击附加 (9–14) - (15–20) 点火焰伤害', weight: 42 },
        { name: '攻击附加 (10–15) - (14–19) 点冰冷伤害', weight: 42 },
        { name: '攻击附加 (1–2) - (28–32) 点闪电伤害', weight: 42 },
        { name: '攻击附加 (11–16) - (13–18) 点腐蚀伤害', weight: 42 },
        { name: '+(20–24)% 物理伤害', weight: 42 },
        { name: '+(20–24)% 元素伤害', weight: 42 },
        { name: '+(20–24)% 腐蚀伤害', weight: 42 },
        { name: '+(20–24)% 近战伤害', weight: 42 },
        { name: '+(6–8)% 攻击速度', weight: 42 },
        { name: '+(30–32)% 连续攻击几率', weight: 10 },
        { name: '连续攻击伤害递增 (14–16)%', weight: 10 },
        { name: '+(6–8)% 元素和腐蚀抗性穿透', weight: 10 },
        { name: '+(5–7)% 护甲减伤穿透', weight: 10 },
        { name: '+1 坚韧祝福层数上限', weight: 1 },
        { name: '+1 灵动祝福层数上限', weight: 1 },
        { name: '+1 聚能祝福层数上限', weight: 1 },
        { name: '+(24–32)% 该装备物理伤害', weight: 10 },
        { name: '该装备附加 (32–34) - (40–42) 点物理伤害', weight: 10 },
        { name: '暴击幸运 +(60–75) 暴击值', weight: 1 }
    ],
    bow: [
        { name: '攻击附加 (10–13) - (14–19) 点物理伤害', weight: 50 },
        { name: '攻击附加 (9–14) - (15–20) 点火焰伤害', weight: 50 },
        { name: '攻击附加 (10–15) - (14–19) 点冰冷伤害', weight: 50 },
        { name: '攻击附加 (1–2) - (28–32) 点闪电伤害', weight: 50 },
        { name: '攻击附加 (11–16) - (13–18) 点腐蚀伤害', weight: 50 },
        { name: '+(20–24)% 物理伤害', weight: 50 },
        { name: '+(20–24)% 元素伤害', weight: 50 },
        { name: '+(20–24)% 腐蚀伤害', weight: 50 },
        { name: '+(20–24)% 远程伤害', weight: 50 },
        { name: '+(6–8)% 攻击速度', weight: 50 },
        { name: '+1 投射物数量', weight: 12 },
        { name: '+1 直射投射物穿透次数', weight: 12 },
        { name: '+(6–8)% 元素和腐蚀抗性穿透', weight: 12 },
        { name: '+(5–7)% 护甲减伤穿透', weight: 12 },
        { name: '+1 坚韧祝福层数上限', weight: 1 },
        { name: '+1 灵动祝福层数上限', weight: 1 },
        { name: '+1 聚能祝福层数上限', weight: 1 },
        { name: '+(24–32)% 该装备物理伤害', weight: 12 },
        { name: '该装备附加 (32–34) - (40–42) 点物理伤害', weight: 12 },
        { name: '暴击幸运 +(60–75) 暴击值', weight: 1 },
        { name: '攻击或法术击败敌人时（20-25）%几率爆炸，对半径5米内的敌人造成被击败的敌人最大生命（15-25）%的间接物理伤害', weight: 1 }
    ],
    spirit_staff: [
        { name: '法术附加 (10–15) - (14–19) 点物理伤害', weight: 30 },
        { name: '法术附加 (9–14) - (15–20) 点火焰伤害', weight: 30 },
        { name: '法术附加 (10–15) - (14–19) 点冰冷伤害', weight: 30 },
        { name: '法术附加 (1–2) - (28–32) 点闪电伤害', weight: 30 },
        { name: '法术附加 (11–16) - (13–18) 点腐蚀伤害', weight: 30 },
        { name: '+(20–24)% 物理伤害', weight: 30 },
        { name: '+(20–24)% 元素伤害', weight: 30 },
        { name: '+(20–24)% 腐蚀伤害', weight: 30 },
        { name: '+(20–24)% 法术伤害', weight: 30 },
        { name: '+(6–8)% 施法速度', weight: 30 },
        { name: '+1 投射物数量', weight: 11 },
        { name: '+1 抛射投射物分裂数量', weight: 11 },
        { name: '+(6–8)% 元素和腐蚀抗性穿透', weight: 11 },
        { name: '+(5–7)% 护甲减伤穿透', weight: 11 },
        { name: '+1 坚韧祝福层数上限', weight: 1 },
        { name: '+1 灵动祝福层数上限', weight: 1 },
        { name: '+1 聚能祝福层数上限', weight: 1 }
    ],
    magic_wand: [
        { name: '法术附加 (10–15) - (14–19) 点物理伤害', weight: 30 },
        { name: '法术附加 (9–14) - (15–20) 点火焰伤害', weight: 30 },
        { name: '法术附加 (10–15) - (14–19) 点冰冷伤害', weight: 30 },
        { name: '法术附加 (1–2) - (28–32) 点闪电伤害', weight: 30 },
        { name: '法术附加 (11–16) - (13–18) 点腐蚀伤害', weight: 30 },
        { name: '+(20–24)% 物理伤害', weight: 30 },
        { name: '+(20–24)% 元素伤害', weight: 30 },
        { name: '+(20–24)% 腐蚀伤害', weight: 30 },
        { name: '+(20–24)% 法术伤害', weight: 30 },
        { name: '+(6–8)% 施法速度', weight: 30 },
        { name: '+1 投射物数量', weight: 11 },
        { name: '+1 抛射投射物分裂数量', weight: 11 },
        { name: '+(6–8)% 元素和腐蚀抗性穿透', weight: 11 },
        { name: '+(5–7)% 护甲减伤穿透', weight: 11 },
        { name: '+1 坚韧祝福层数上限', weight: 1 },
        { name: '+1 灵动祝福层数上限', weight: 1 },
        { name: '+1 聚能祝福层数上限', weight: 1 }
    ],
    hand_staff: [
        { name: '法术附加 (10–15) - (14–19) 点物理伤害', weight: 30 },
        { name: '法术附加 (9–14) - (15–20) 点火焰伤害', weight: 30 },
        { name: '法术附加 (10–15) - (14–19) 点冰冷伤害', weight: 30 },
        { name: '法术附加 (1–2) - (28–32) 点闪电伤害', weight: 30 },
        { name: '法术附加 (11–16) - (13–18) 点腐蚀伤害', weight: 30 },
        { name: '+(20–24)% 物理伤害', weight: 30 },
        { name: '+(20–24)% 元素伤害', weight: 30 },
        { name: '+(20–24)% 腐蚀伤害', weight: 30 },
        { name: '+(20–24)% 法术伤害', weight: 30 },
        { name: '+(6–8)% 施法速度', weight: 30 },
        { name: '+1 投射物数量', weight: 11 },
        { name: '+1 抛射投射物分裂数量', weight: 11 },
        { name: '+(6–8)% 元素和腐蚀抗性穿透', weight: 11 },
        { name: '+(5–7)% 护甲减伤穿透', weight: 11 },
        { name: '+1 坚韧祝福层数上限', weight: 1 },
        { name: '+1 灵动祝福层数上限', weight: 1 },
        { name: '+1 聚能祝福层数上限', weight: 1 }
    ],
    two_hand_hammer: [
        { name: '攻击附加 (10–15) - (14–19) 点物理伤害', weight: 42 },
        { name: '攻击附加 (9–14) - (15–20) 点火焰伤害', weight: 42 },
        { name: '攻击附加 (10–15) - (14–19) 点冰冷伤害', weight: 42 },
        { name: '攻击附加 (1–2) - (28–32) 点闪电伤害', weight: 42 },
        { name: '攻击附加 (11–16) - (13–18) 点腐蚀伤害', weight: 42 },
        { name: '+(20–24)% 物理伤害', weight: 42 },
        { name: '+(20–24)% 元素伤害', weight: 42 },
        { name: '+(20–24)% 腐蚀伤害', weight: 42 },
        { name: '+(20–24)% 近战伤害', weight: 42 },
        { name: '+(6–8)% 攻击速度', weight: 42 },
        { name: '消耗破击蓄能时，该次技能额外 +(12–16)% 伤害', weight: 10 },
        { name: '造成伤害时，淘汰生命值低于 (5–7)% 的敌人', weight: 10 },
        { name: '+(6–8)% 元素和腐蚀抗性穿透', weight: 10 },
        { name: '+(5–7)% 护甲减伤穿透', weight: 10 },
        { name: '+1 坚韧祝福层数上限', weight: 1 },
        { name: '+1 灵动祝福层数上限', weight: 1 },
        { name: '+1 聚能祝福层数上限', weight: 1 },
        { name: '+(24–32)% 该装备物理伤害', weight: 10 },
        { name: '该装备附加 (32–34) - (40–42) 点物理伤害', weight: 10 },
        { name: '暴击幸运 +(60–75) 暴击值', weight: 1 }
    ],
    two_hand_axe: [
        { name: '攻击附加 (10–15) - (14–19) 点物理伤害', weight: 42 },
        { name: '攻击附加 (9–14) - (15–20) 点火焰伤害', weight: 42 },
        { name: '攻击附加 (10–15) - (14–19) 点冰冷伤害', weight: 42 },
        { name: '攻击附加 (1–2) - (28–32) 点闪电伤害', weight: 42 },
        { name: '攻击附加 (11–16) - (13–18) 点腐蚀伤害', weight: 42 },
        { name: '+(20–24)% 物理伤害', weight: 42 },
        { name: '+(20–24)% 元素伤害', weight: 42 },
        { name: '+(20–24)% 腐蚀伤害', weight: 42 },
        { name: '+(20–24)% 近战伤害', weight: 42 },
        { name: '+(6–8)% 攻击速度', weight: 42 },
        { name: '对创伤状态下的敌人，额外 +(6–8)% 伤害', weight: 10 },
        { name: '额外 +(6–9)% 斩击伤害', weight: 10 },
        { name: '+(6–8)% 元素和腐蚀抗性穿透', weight: 10 },
        { name: '+(5–7)% 护甲减伤穿透', weight: 10 },
        { name: '+1 坚韧祝福层数上限', weight: 1 },
        { name: '+1 灵动祝福层数上限', weight: 1 },
        { name: '+1 聚能祝福层数上限', weight: 1 },
        { name: '+(24–32)% 该装备物理伤害', weight: 10 },
        { name: '该装备附加 (32–34) - (40–42) 点物理伤害', weight: 10 },
        { name: '暴击幸运 +(60–75) 暴击值', weight: 1 }
    ],
    tin_staff: [
        { name: '法术附加 (10–15) - (14–19) 点物理伤害', weight: 42 },
        { name: '法术附加 (9–14) - (15–20) 点火焰伤害', weight: 42 },
        { name: '法术附加 (10–15) - (14–19) 点冰冷伤害', weight: 42 },
        { name: '法术附加 (1–2) - (28–32) 点闪电伤害', weight: 42 },
        { name: '法术附加 (11–16) - (13–18) 点腐蚀伤害', weight: 42 },
        { name: '+(20–24)% 物理伤害', weight: 42 },
        { name: '+(20–24)% 元素伤害', weight: 42 },
        { name: '+(20–24)% 腐蚀伤害', weight: 42 },
        { name: '+(20–24)% 法术伤害', weight: 42 },
        { name: '+(6–8)% 施法速度', weight: 42 },
        { name: '+1 投射物数量', weight: 10 },
        { name: '+1 抛射投射物分裂数量', weight: 10 },
        { name: '+(6–8)% 元素和腐蚀抗性穿透', weight: 10 },
        { name: '+(5–7)% 护甲减伤穿透', weight: 10 },
        { name: '+1 坚韧祝福层数上限', weight: 1 },
        { name: '+1 灵动祝福层数上限', weight: 1 },
        { name: '+1 聚能祝福层数上限', weight: 1 },
        { name: '+(24–32)% 该装备物理伤害', weight: 10 },
        { name: '该装备附加 (32–34) - (40–42) 点物理伤害', weight: 10 },
        { name: '暴击幸运 +(60–75) 暴击值', weight: 1 }
    ],
    war_staff: [
        { name: '法术附加 (10–15) - (14–19) 点物理伤害', weight: 42 },
        { name: '法术附加 (9–14) - (15–20) 点火焰伤害', weight: 42 },
        { name: '法术附加 (10–15) - (14–19) 点冰冷伤害', weight: 42 },
        { name: '法术附加 (1–2) - (28–32) 点闪电伤害', weight: 42 },
        { name: '法术附加 (11–16) - (13–18) 点腐蚀伤害', weight: 42 },
        { name: '+(20–24)% 物理伤害', weight: 42 },
        { name: '+(20–24)% 元素伤害', weight: 42 },
        { name: '+(20–24)% 腐蚀伤害', weight: 42 },
        { name: '+(20–24)% 法术伤害', weight: 42 },
        { name: '+(6–8)% 施法速度', weight: 42 },
        { name: '+1 投射物数量', weight: 10 },
        { name: '+1 抛射投射物分裂数量', weight: 10 },
        { name: '+(6–8)% 元素和腐蚀抗性穿透', weight: 10 },
        { name: '+(5–7)% 护甲减伤穿透', weight: 10 },
        { name: '+1 坚韧祝福层数上限', weight: 1 },
        { name: '+1 灵动祝福层数上限', weight: 1 },
        { name: '+1 聚能祝福层数上限', weight: 1 },
        { name: '+(24–32)% 该装备物理伤害', weight: 10 },
        { name: '该装备附加 (32–34) - (40–42) 点物理伤害', weight: 10 },
        { name: '暴击幸运 +(60–75) 暴击值', weight: 1 }
    ],
    crossbow: [
        { name: '攻击附加 (10–13) - (14–19) 点物理伤害', weight: 50 },
        { name: '攻击附加 (9–14) - (15–20) 点火焰伤害', weight: 50 },
        { name: '攻击附加 (10–15) - (14–19) 点冰冷伤害', weight: 50 },
        { name: '攻击附加 (1–2) - (28–32) 点闪电伤害', weight: 50 },
        { name: '攻击附加 (11–16) - (13–18) 点腐蚀伤害', weight: 50 },
        { name: '+(20–24)% 物理伤害', weight: 50 },
        { name: '+(20–24)% 元素伤害', weight: 50 },
        { name: '+(20–24)% 腐蚀伤害', weight: 50 },
        { name: '+(20–24)% 远程伤害', weight: 50 },
        { name: '+(6–8)% 攻击速度', weight: 50 },
        { name: '+1 投射物数量', weight: 12 },
        { name: '+1 直射投射物穿透次数', weight: 12 },
        { name: '+(6–8)% 元素和腐蚀抗性穿透', weight: 12 },
        { name: '+(5–7)% 护甲减伤穿透', weight: 12 },
        { name: '+1 坚韧祝福层数上限', weight: 1 },
        { name: '+1 灵动祝福层数上限', weight: 1 },
        { name: '+1 聚能祝福层数上限', weight: 1 },
        { name: '+(24–32)% 该装备物理伤害', weight: 12 },
        { name: '该装备附加 (32–34) - (40–42) 点物理伤害', weight: 12 },
        { name: '暴击幸运 +(60–75) 暴击值', weight: 1 }
    ],
    rifle: [
        { name: '攻击附加 (10–15) - (14–19) 点物理伤害', weight: 42 },
        { name: '攻击附加 (9–14) - (15–20) 点火焰伤害', weight: 42 },
        { name: '攻击附加 (10–15) - (14–19) 点冰冷伤害', weight: 42 },
        { name: '攻击附加 (1–2) - (28–32) 点闪电伤害', weight: 42 },
        { name: '攻击附加 (11–16) - (13–18) 点腐蚀伤害', weight: 42 },
        { name: '+(20–24)% 物理伤害', weight: 42 },
        { name: '+(20–24)% 元素伤害', weight: 42 },
        { name: '+(20–24)% 腐蚀伤害', weight: 42 },
        { name: '+(20–24)% 远程伤害', weight: 42 },
        { name: '+(6–8)% 攻击速度', weight: 42 },
        { name: '+1 投射物数量', weight: 10 },
        { name: '+1 抛射投射物分裂数量', weight: 10 },
        { name: '+(6–8)% 元素和腐蚀抗性穿透', weight: 10 },
        { name: '+(5–7)% 护甲减伤穿透', weight: 10 },
        { name: '+1 坚韧祝福层数上限', weight: 1 },
        { name: '+1 灵动祝福层数上限', weight: 1 },
        { name: '+1 聚能祝福层数上限', weight: 1 },
        { name: '+(24–32)% 该装备物理伤害', weight: 10 },
        { name: '该装备附加 (32–34) - (40–42) 点物理伤害', weight: 10 },
        { name: '暴击幸运 +(60–75) 暴击值', weight: 1 }
    ],
    cannon: [
        { name: '攻击附加 (10–15) - (14–19) 点物理伤害', weight: 42 },
        { name: '攻击附加 (9–14) - (15–20) 点火焰伤害', weight: 42 },
        { name: '攻击附加 (10–15) - (14–19) 点冰冷伤害', weight: 42 },
        { name: '攻击附加 (1–2) - (28–32) 点闪电伤害', weight: 42 },
        { name: '攻击附加 (11–16) - (13–18) 点腐蚀伤害', weight: 42 },
        { name: '+(20–24)% 物理伤害', weight: 42 },
        { name: '+(20–24)% 元素伤害', weight: 42 },
        { name: '+(20–24)% 腐蚀伤害', weight: 42 },
        { name: '+(20–24)% 远程伤害', weight: 42 },
        { name: '+(6–8)% 攻击速度', weight: 42 },
        { name: '+1 投射物数量', weight: 10 },
        { name: '+1 抛射投射物分裂数量', weight: 10 },
        { name: '+(6–8)% 元素和腐蚀抗性穿透', weight: 10 },
        { name: '+(5–7)% 护甲减伤穿透', weight: 10 },
        { name: '+1 坚韧祝福层数上限', weight: 1 },
        { name: '+1 灵动祝福层数上限', weight: 1 },
        { name: '+1 聚能祝福层数上限', weight: 1 },
        { name: '+(24–32)% 该装备物理伤害', weight: 10 },
        { name: '该装备附加 (32–34) - (40–42) 点物理伤害', weight: 10 },
        { name: '暴击幸运 +(60–75) 暴击值', weight: 1 }
    ]
};

// 初始化解梦系统
function initializeDreamSystem() {
    const positionSelect = document.getElementById('dream-position');
    const typeSelect = document.getElementById('dream-type');
    const affixSelect = document.getElementById('dream-affix');
    
    // 部位选择变化事件
    positionSelect.addEventListener('change', function() {
        const selectedPosition = this.value;
        
        // 清空类型和词缀选择
        typeSelect.innerHTML = '<option value="">请选择装备类型</option>';
        affixSelect.innerHTML = '<option value="">请先选择装备类型</option>';
        
        if (selectedPosition && dreamData[selectedPosition]) {
            const positionData = dreamData[selectedPosition];
            typeSelect.disabled = false;
            
            // 填充类型选项
            positionData.types.forEach(type => {
                const option = document.createElement('option');
                option.value = type.value;
                option.textContent = type.name;
                typeSelect.appendChild(option);
            });
        } else {
            typeSelect.disabled = true;
            affixSelect.disabled = true;
        }
    });
    
    // 类型选择变化事件
    typeSelect.addEventListener('change', function() {
        const selectedPosition = positionSelect.value;
        const selectedType = this.value;
        
        // 清空词缀选择
        affixSelect.innerHTML = '<option value="">请选择需求词缀</option>';
        
        if (selectedPosition && selectedType) {
            let affixes = [];
            
            if (selectedPosition === 'weapon' && weaponAffixes[selectedType]) {
                affixes = weaponAffixes[selectedType];
            } else if (selectedPosition === 'accessory' && accessoryAffixes[selectedType]) {
                affixes = accessoryAffixes[selectedType];
            }
            
            if (affixes.length > 0) {
                affixSelect.disabled = false;
                
                // 填充词缀选项
                affixes.forEach((affix, index) => {
                    const option = document.createElement('option');
                    option.value = index;
                    option.textContent = `${affix.name} (权重: ${affix.weight})`;
                    affixSelect.appendChild(option);
                });
            } else {
                affixSelect.disabled = true;
            }
        } else {
            affixSelect.disabled = true;
        }
    });
}

// 计算解梦成本
function calculateDreamCost() {
    const positionSelect = document.getElementById('dream-position');
    const typeSelect = document.getElementById('dream-type');
    const levelSelect = document.getElementById('dream-level');
    const affixSelect = document.getElementById('dream-affix');
    const weaponPriceInput = document.getElementById('dream-weapon-price');
    const accessoryPriceInput = document.getElementById('dream-accessory-price');
    const resultElement = document.getElementById('dream-result');
    
    const selectedPosition = positionSelect.value;
    const selectedType = typeSelect.value;
    const selectedLevel = parseInt(levelSelect.value);
    const selectedAffixIndex = parseInt(affixSelect.value);
    const weaponPrice = parseFloat(weaponPriceInput.value) || 0;
    const accessoryPrice = parseFloat(accessoryPriceInput.value) || 0;
    
    // 验证输入
    if (!selectedPosition || !selectedType || isNaN(selectedAffixIndex)) {
        resultElement.textContent = '请完整选择装备信息和需求词缀';
        return;
    }
    
    // 获取装备数据
    const positionData = dreamData[selectedPosition];
    if (!positionData) {
        resultElement.textContent = '装备数据错误';
        return;
    }
    
    // 获取词缀数据
    let affixes = [];
    if (selectedPosition === 'weapon' && weaponAffixes[selectedType]) {
        affixes = weaponAffixes[selectedType];
    } else if (selectedPosition === 'accessory' && accessoryAffixes[selectedType]) {
        affixes = accessoryAffixes[selectedType];
    }
    
    if (!affixes[selectedAffixIndex]) {
        resultElement.textContent = '词缀数据错误';
        return;
    }
    
    const selectedAffix = affixes[selectedAffixIndex];
    
    // 计算总权重
    const totalWeight = affixes.reduce((sum, affix) => sum + affix.weight, 0);
    
    // 确定材料价格和消耗数量
    const isAccessory = positionData.isAccessory;
    const materialPrice = isAccessory ? accessoryPrice : weaponPrice;
    const materialName = isAccessory ? '梦语-饰品' : '梦语-武器';
    
    if (materialPrice <= 0) {
        resultElement.textContent = `请输入有效的${materialName}价格`;
        return;
    }
    
    // 根据等级确定消耗数量
    let materialCount;
    switch (selectedLevel) {
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
    
    // 计算解梦成本
    // 公式：（需要解梦的词缀权重/该装备所有解梦词缀权重总和）*（对应解梦材料价格*需要消耗的材料数量）
    // 注意：每次解梦会给出3个词缀选项，所以获得想要词缀的几率要乘以3
    const baseProbability = selectedAffix.weight / totalWeight;
    const probability = baseProbability * 3; // 每次解梦给出3个选项
    const totalCost = (materialPrice * materialCount) / probability;
    
    // 显示结果
    resultElement.innerHTML = `
        <div style="font-size: 1.2em; font-weight: bold; margin-bottom: 0.5rem;">
            解梦成本：${totalCost.toFixed(2)} 初火源质
        </div>
        <div style="font-size: 0.9em; color: rgba(255,255,255,0.8); line-height: 1.4;">
            词缀权重：${selectedAffix.weight} / 总权重：${totalWeight}<br>
            出现概率：${(probability * 100).toFixed(2)}%<br>
            材料消耗：${materialName} × ${materialCount}<br>
            材料单价：${materialPrice} 初火源质
        </div>
    `;
}

// 通知系统
function showNotification(message, type = 'info') {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // 添加样式
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${getNotificationColor(type)};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        z-index: 1000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
    `;
    
    // 添加到页面
    document.body.appendChild(notification);
    
    // 显示动画
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // 自动移除
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// 获取通知图标
function getNotificationIcon(type) {
    const icons = {
        'success': 'fa-check-circle',
        'error': 'fa-exclamation-circle',
        'warning': 'fa-exclamation-triangle',
        'info': 'fa-info-circle'
    };
    return icons[type] || icons.info;
}

// 获取通知颜色
function getNotificationColor(type) {
    const colors = {
        'success': 'linear-gradient(135deg, #4CAF50, #45a049)',
        'error': 'linear-gradient(135deg, #f44336, #d32f2f)',
        'warning': 'linear-gradient(135deg, #ff9800, #f57c00)',
        'info': 'linear-gradient(135deg, #2196F3, #1976D2)'
    };
    return colors[type] || colors.info;
}

// 数据导出功能
function exportData() {
    const data = {
        timestamp: new Date().toISOString(),
        crafting: getCraftingData(),
        damage: getDamageData()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `torch_calculator_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    showNotification('数据导出成功！', 'success');
}

// 获取打造系统数据
function getCraftingData() {
    return {
        weaponType: document.querySelector('input[name="weapon-type"]:checked')?.value,
        equipmentLevel: document.querySelector('input[name="equipment-level"]:checked')?.value,
        affixes: {
            basic: document.querySelector('.affix-category:nth-child(1) .affix-row:nth-child(2) select')?.value,
            basicT0: document.querySelector('.affix-category:nth-child(1) .affix-row:nth-child(3) select')?.value,
            // ... 其他词缀数据
        },
        materials: Array.from(document.querySelectorAll('.material-input')).map(input => input.value)
    };
}

// 获取伤害系统数据
function getDamageData() {
    return {
        damageReduction: Array.from(document.querySelectorAll('.dr-row')).map(row => ({
            source: `来源${row.querySelector('.dr-number')?.textContent}`,
            method: row.querySelector('.dr-method')?.value,
            layers: row.querySelector('.dr-layers')?.value,
            percent: row.querySelector('.dr-percent')?.value
        })),
        multiplyDamage: {
            singleIncrease: document.getElementById('single-damage-increase')?.value,
            multiplyTimes: document.getElementById('multiply-times')?.value
        },
        damageImprovement: {
            before: document.getElementById('damage-before')?.value,
            after: document.getElementById('damage-after')?.value
        }
    };
}

// 键盘快捷键
document.addEventListener('keydown', function(e) {
    // Ctrl + Enter 执行当前标签页的计算
    if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        if (currentTab === 'crafting') {
            calculateCraftingCost();
        } else if (currentTab === 'damage') {
            // 根据焦点元素决定执行哪个计算
            const focusedElement = document.activeElement;
            const parentCard = focusedElement.closest('.module-card');
            
            if (parentCard) {
                const cardTitle = parentCard.querySelector('h3').textContent;
                if (cardTitle.includes('减伤')) {
                    calculateDamageReduction();
                } else if (cardTitle.includes('叠乘')) {
                    calculateMultiplyDamage();
                } else if (cardTitle.includes('提升')) {
                    calculateDamageImprovement();
                }
            }
        }
    }
    
    // Ctrl + S 导出数据
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        exportData();
    }
});

// 添加工具提示
function addTooltips() {
    const tooltips = {
        'weapon-type': '选择装备类型会影响基础成本计算',
        'equipment-level': '装备等级越高，基础成本越高',
        'affix-select': '词缀数量会影响材料消耗',
        'material-input': '输入当前市场价格以获得准确成本',
        'dr-method': '叠加：直接相加；叠乘：按比例计算',
        'dr-layers': '减伤效果的层数',
        'dr-percent': '每层减伤的百分比'
    };
    
    Object.keys(tooltips).forEach(className => {
        const elements = document.querySelectorAll(`.${className}`);
        elements.forEach(element => {
            element.title = tooltips[className];
        });
    });
}

// 初始化工具提示
addTooltips();

// 性能优化：防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 实时计算（可选功能）
const debouncedCalculate = debounce(() => {
    if (currentTab === 'crafting') {
        calculateCraftingCost();
    }
}, 1000);

// 为输入框添加实时计算（可选）
// document.querySelectorAll('input, select').forEach(element => {
//     element.addEventListener('input', debouncedCalculate);
// });

// 数量调整函数
function adjustQuantity(inputId, delta) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    const currentValue = parseInt(input.value) || 0;
    const newValue = Math.max(0, currentValue + delta);
    
    input.value = newValue;
    
    // 触发input事件以更新计算
    input.dispatchEvent(new Event('input', { bubbles: true }));
}

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
        '魔灵之友': { compensation: -30, multiplier: 100 },
        // 新增技能类型
        '所有贯注华贵/崇高技能': { compensation: 0, multiplier: 110 },
        '其他魔力消耗倍率100%技能': { compensation: 0, multiplier: 100 },
        '其他魔力消耗倍率110%技能': { compensation: 0, multiplier: 110 },
        '其他魔力封印补偿为0%技能': { compensation: 0, multiplier: 100 }
    },
    // 等级相关的技能
    levelBasedSkills: {
        '节流': {
            multiplier: 100,
            levels: {
                1: 0.5, 2: 1, 3: 1.5, 4: 2, 5: 2.5, 6: 3, 7: 3.5, 8: 4, 9: 4.5, 10: 5,
                11: 5.5, 12: 6, 13: 6.5, 14: 7, 15: 7.5, 16: 8, 17: 8.5, 18: 9, 19: 9.5, 20: 10,
                21: 10.5, 22: 11, 23: 11.5, 24: 12, 25: 12.5, 26: 13, 27: 13.5, 28: 14, 29: 14.5, 30: 15,
                31: 15.5, 32: 16, 33: 16.5, 34: 17, 35: 17.5, 36: 18, 37: 18.5, 38: 19, 39: 19.5, 40: 20
            }
        },
        '精密 节流': {
            multiplier: 100,
            levels: {
                1: 15.5, 2: 16, 3: 16.5, 4: 17, 5: 17.5, 6: 18, 7: 18.5, 8: 19, 9: 19.5, 10: 20,
                11: 20.5, 12: 21, 13: 21.5, 14: 22, 15: 22.5, 16: 23, 17: 23.5, 18: 24, 19: 24.5, 20: 25,
                21: 25.5, 22: 26, 23: 26.5, 24: 27, 25: 27.5, 26: 28, 27: 28.5, 28: 29, 29: 29.5, 30: 30,
                31: 30.5, 32: 31, 33: 31.5, 34: 32, 35: 32.5, 36: 33, 37: 33.5, 38: 34, 39: 34.5, 40: 35
            }
        },
        '封印转化': {
            multiplier: 100,
            levels: {
                1: -70, 2: -69.75, 3: -69.5, 4: -69.25, 5: -69, 6: -68.75, 7: -68.5, 8: -68.25, 9: -68, 10: -67.75,
                11: -67.5, 12: -67.25, 13: -67, 14: -66.75, 15: -66.5, 16: -66.25, 17: -66, 18: -65.75, 19: -65.5, 20: -65.25,
                21: -65, 22: -64.25, 23: -63.5, 24: -62.75, 25: -62, 26: -61.25, 27: -60.5, 28: -59.75, 29: -59, 30: -58.25,
                31: -57.5, 32: -56.75, 33: -56, 34: -55.25, 35: -54.5, 36: -53.75, 37: -53, 38: -52.25, 39: -51.5, 40: -50.75
            }
        },
        '超能共生': {
            multiplier: 100,
            levels: {
                1: 48.2, 2: 48.4, 3: 48.6, 4: 48.8, 5: 49, 6: 49.2, 7: 49.4, 8: 49.6, 9: 49.8, 10: 50,
                11: 50.2, 12: 50.4, 13: 50.6, 14: 50.8, 15: 51, 16: 51.2, 17: 51.4, 18: 51.6, 19: 51.8, 20: 52,
                21: 52.2, 22: 52.4, 23: 52.6, 24: 52.8, 25: 53, 26: 53.2, 27: 53.4, 28: 53.6, 29: 53.8, 30: 54,
                31: 54.2, 32: 54.4, 33: 54.6, 34: 54.8, 35: 55, 36: 55.2, 37: 55.4, 38: 55.6, 39: 55.8, 40: 56
            }
        }
    }
};

// 初始化封印系统
function initializeSealSystem() {
    setupSealHaloTabs();
    setupSealTypeListeners();
    populateSupportSkillDropdowns();
    setupSealCalculationListeners();
}

// 设置光环标签页
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
            document.getElementById(`seal-halo-${haloNumber}`).classList.add('active');
        });
    });
}

// 设置封印类型监听器
function setupSealTypeListeners() {
    for (let i = 1; i <= 4; i++) {
        const sealTypeSelect = document.getElementById(`seal-type-${i}`);
        const conversionGroup = document.getElementById(`conversion-group-${i}`);
        
        if (sealTypeSelect && conversionGroup) {
            sealTypeSelect.addEventListener('change', function() {
                if (this.value === 'life') {
                    conversionGroup.style.display = 'block';
                } else {
                    conversionGroup.style.display = 'none';
                }
            });
        }
    }
}

// 填充辅助技能下拉框
function populateSupportSkillDropdowns() {
    const allSkills = [];
    
    // 添加固定技能（排除封印转化相关）
    Object.keys(supportSkillsData.fixedSkills).forEach(skill => {
        if (!skill.includes('封印转化')) {
            allSkills.push(skill);
        }
    });
    
    // 添加等级相关技能（排除封印转化相关）
    Object.keys(supportSkillsData.levelBasedSkills).forEach(skill => {
        if (!skill.includes('封印转化')) {
            allSkills.push(skill);
        }
    });
    
    // 填充所有辅助技能下拉框
    for (let halo = 1; halo <= 4; halo++) {
        for (let skill = 1; skill <= 4; skill++) {
            const select = document.getElementById(`support-skill-${halo}-${skill}`);
            if (select) {
                // 清空现有选项
                select.innerHTML = '<option value="">请选择技能</option>';
                allSkills.forEach(skillName => {
                    const option = document.createElement('option');
                    option.value = skillName;
                    option.textContent = skillName;
                    select.appendChild(option);
                });
            }
        }
    }
    
    // 填充封印转化技能下拉框
    for (let i = 1; i <= 4; i++) {
        const conversionSelect = document.getElementById(`conversion-skill-${i}`);
        if (conversionSelect) {
            // 清空现有选项
            conversionSelect.innerHTML = '<option value="">请选择技能</option>';
            const conversionSkills = ['封印转化', '精密 封印转化'];
            conversionSkills.forEach(skill => {
                const option = document.createElement('option');
                option.value = skill;
                option.textContent = skill;
                conversionSelect.appendChild(option);
            });
        }
    }
}

// 设置封印计算监听器
function setupSealCalculationListeners() {
    // 为计算按钮添加事件监听
    const calculateBtn = document.getElementById('calculate-seal-btn');
    if (calculateBtn) {
        calculateBtn.addEventListener('click', calculateSealSystem);
    }
    
    // 为所有相关输入添加事件监听
    const inputs = [
        'equipment-seal-compensation', 'other-seal-compensation'
    ];
    
    // 为所有光环的输入字段添加监听器
    for (let i = 1; i <= 4; i++) {
        inputs.push(
            `base-seal-${i}`,
            `seal-type-${i}`,
            `pathfinder-slots-${i}`,
            `conversion-skill-${i}`,
            `conversion-level-${i}`,
            `support-skill-${i}-1`,
            `support-level-${i}-1`,
            `support-skill-${i}-2`,
            `support-level-${i}-2`,
            `support-skill-${i}-3`,
            `support-level-${i}-3`,
            `support-skill-${i}-4`,
            `support-level-${i}-4`
        );
    }
    
    
    inputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', calculateSealSystem);
            element.addEventListener('input', calculateSealSystem);
        }
    });
}

// 计算单个光环封印
function calculateIndividualHaloSeal() {
    for (let i = 1; i <= 4; i++) {
        const baseSeal = parseFloat(document.getElementById(`base-seal-${i}`).value) || 0;
        const sealType = document.getElementById(`seal-type-${i}`).value;
        const pathfinderSlots = parseInt(document.getElementById(`pathfinder-slots-${i}`).value) || 0;
        
        if (baseSeal === 0) {
            document.getElementById(`halo-result-${i}`).textContent = '0%';
            continue;
        }
        
        // 获取全局封印补偿
        const equipmentCompensation = parseFloat(document.getElementById('equipment-seal-compensation').value) || 0;
        const otherCompensation = parseFloat(document.getElementById('other-seal-compensation').value) || 0;
        const totalCompensation = (equipmentCompensation + otherCompensation) / 100;
        
        // 计算辅助技能魔力封印补偿
        let supportSkillCompensation = 0;
        for (let j = 1; j <= 4; j++) {
            const skillName = document.getElementById(`support-skill-${i}-${j}`).value;
            const skillLevel = parseInt(document.getElementById(`support-level-${i}-${j}`).value) || 1;
            
            if (skillName) {
                const compensation = getSupportSkillCompensation(skillName, skillLevel);
                supportSkillCompensation += compensation / 100;
            }
        }
        
        // 计算封印转化补偿（仅生命封印）
        let conversionCompensation = 0;
        if (sealType === 'life') {
            const conversionSkill = document.getElementById(`conversion-skill-${i}`).value;
            const conversionLevel = parseInt(document.getElementById(`conversion-level-${i}`).value) || 1;
            
            if (conversionSkill) {
                conversionCompensation = getSupportSkillCompensation(conversionSkill, conversionLevel) / 100;
            }
        }
        
        // 计算独辟蹊径减少
        const pathfinderReduction = Math.pow(0.95, pathfinderSlots);
        
        // 计算最终封印量
        let finalSeal;
        if (sealType === 'life') {
            // 生命封印公式
            finalSeal = (baseSeal / (1 + totalCompensation + supportSkillCompensation) * pathfinderReduction) / (1 + conversionCompensation);
        } else {
            // 魔力封印公式
            finalSeal = (baseSeal / (1 + totalCompensation + supportSkillCompensation) * pathfinderReduction);
        }
        
        document.getElementById(`halo-result-${i}`).textContent = finalSeal.toFixed(2) + '%';
    }
}

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

// 计算封印系统总结果
function calculateSealSystem() {
    // 先计算各个光环的封印
    calculateIndividualHaloSeal();
    
    let totalManaSeal = 0;
    let totalLifeSeal = 0;
    
    // 汇总各光环结果
    for (let i = 1; i <= 4; i++) {
        const sealType = document.getElementById(`seal-type-${i}`).value;
        const resultText = document.getElementById(`halo-result-${i}`).textContent;
        const sealValue = parseFloat(resultText.replace('%', '')) || 0;
        
        if (sealType === 'mana') {
            totalManaSeal += sealValue;
        } else if (sealType === 'life') {
            totalLifeSeal += sealValue;
        }
    }
    
    // 更新总结果显示
    document.getElementById('total-mana-seal').textContent = totalManaSeal.toFixed(2) + '%';
    document.getElementById('total-life-seal').textContent = totalLifeSeal.toFixed(2) + '%';
    
    // 显示通知
    showNotification('封印计算完成！', 'success');
}



// 高塔系统数据和功能
const towerSystemData = {
    // 武器类型到元件类型的映射
    weaponToComponent: {
        '法杖': 'caster',
        '灵杖': 'caster',
        '魔杖': 'caster',
        '手杖': 'caster',
        '锡杖': 'caster',
        '武杖': 'caster',
        '剑': 'guard',
        '斧': 'guard',
        '锤': 'guard',
        '爪': 'guard',
        '匕首': 'guard',
        '手枪': 'sniper',
        '弓': 'sniper',
        '弩': 'sniper',
        '炮': 'sniper',
        '火枪': 'sniper',
        '盾': 'defense'
    },
    
    // 研发材料需求配置
    researchRequirements: {
        '86': {
            '单手': {
                '基础': { fireSource: 40, basicComponent: 4, expandComponent: 0 },
                '深度': { fireSource: 200, basicComponent: 0, expandComponent: 4 }
            },
            '双手': {
                '基础': { fireSource: 80, basicComponent: 8, expandComponent: 0 },
                '深度': { fireSource: 400, basicComponent: 0, expandComponent: 8 }
            }
        },
        '100': {
            '单手': {
                '基础': { fireSource: 100, basicComponent: 10, expandComponent: 0 },
                '深度': { fireSource: 500, basicComponent: 0, expandComponent: 10 }
            },
            '双手': {
                '基础': { fireSource: 200, basicComponent: 20, expandComponent: 0 },
                '深度': { fireSource: 500, basicComponent: 0, expandComponent: 20 }
            }
        }
    },
    
    // 序列概率配置
    sequenceProbabilities: {
        '基础': {
            'no_repeat': 10.69,      // 没有重复数字
            'one_double': 6.22,      // 1个数字重复2次
            'one_triple': 2.33       // 1个数字重复3次
        },
        '深度': {
            'no_repeat': 5.19,       // 没有重复数字
            'one_double': 1.8,       // 1个数字重复2次
            'two_double': 6.0,       // 2个数字重复2次
            'one_triple': 2.0,       // 1个数字重复3次
            'one_quadruple': 0.50    // 1个数字重复4次
        }
    }
};

// 初始化高塔系统
function initializeTowerSystem() {
    setupTowerEventListeners();
    loadTowerComponentPrices();
    console.log('高塔系统初始化完成');
}

// 设置高塔系统事件监听器
function setupTowerEventListeners() {
    // 武器配置变化监听
    const weaponInputs = ['weapon-type', 'weapon-level', 'weapon-category'];
    weaponInputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', updateTowerMaterialsDisplay);
        }
    });
    
    // 研发类型变化监听
    const researchTypeElement = document.getElementById('research-type');
    if (researchTypeElement) {
        researchTypeElement.addEventListener('change', function() {
            updateTowerMaterialsDisplay();
            updateSequenceInputValidation();
        });
    }
    
    // 序列输入验证
    const sequenceInput = document.getElementById('target-sequence');
    if (sequenceInput) {
        sequenceInput.addEventListener('input', validateSequenceInput);
    }
    
    // 元件价格保存
    const priceInputs = ['basic-component-price', 'caster-component-price', 'guard-component-price', 'sniper-component-price', 'defense-component-price'];
    priceInputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', saveTowerComponentPrices);
        }
    });
    
    // 计算按钮
    const calculateBtn = document.getElementById('tower-calculate');
    if (calculateBtn) {
        calculateBtn.addEventListener('click', calculateTowerResearch);
    }
}

// 更新材料需求显示
function updateTowerMaterialsDisplay() {
    const weaponType = document.getElementById('weapon-type')?.value;
    const weaponLevel = document.getElementById('weapon-level')?.value;
    const weaponCategory = document.getElementById('weapon-category')?.value;
    const researchType = document.getElementById('research-type')?.value;
    const materialsDisplay = document.getElementById('materials-display');
    
    if (!weaponType || !weaponLevel || !weaponCategory || !researchType || !materialsDisplay) {
        return;
    }
    
    const requirements = towerSystemData.researchRequirements[weaponLevel]?.[weaponCategory]?.[researchType];
    if (!requirements) {
        materialsDisplay.innerHTML = `
            <div class="materials-placeholder">
                <i class="fas fa-exclamation-triangle"></i>
                <span>无效的配置组合</span>
            </div>
        `;
        return;
    }
    
    const componentType = towerSystemData.weaponToComponent[weaponType];
    const materials = [];
    
    // 添加初火源质
    materials.push({
        name: '初火源质',
        amount: requirements.fireSource
    });
    
    // 添加基础元件
    if (requirements.basicComponent > 0) {
        materials.push({
            name: '基础元件',
            amount: requirements.basicComponent
        });
    }
    
    // 添加拓展元件
    if (requirements.expandComponent > 0) {
        const componentNames = {
            'caster': '拓展元件-术士',
            'guard': '拓展元件-近卫',
            'sniper': '拓展元件-狙击',
            'defense': '拓展元件-重装'
        };
        materials.push({
            name: componentNames[componentType],
            amount: requirements.expandComponent
        });
    }
    
    // 生成材料列表HTML
    const materialsHTML = materials.map(material => `
        <div class="material-item">
            <span class="material-name">${material.name}</span>
            <span class="material-amount">${material.amount}</span>
        </div>
    `).join('');
    
    materialsDisplay.innerHTML = `
        <div class="materials-list">
            ${materialsHTML}
        </div>
    `;
}

// 更新序列输入验证规则
function updateSequenceInputValidation() {
    const researchType = document.getElementById('research-type')?.value;
    const sequenceInput = document.getElementById('target-sequence');
    
    if (!sequenceInput) return;
    
    if (researchType === '基础') {
        sequenceInput.maxLength = 3;
        sequenceInput.placeholder = '请输入3位数字(1-7)';
    } else if (researchType === '深度') {
        sequenceInput.maxLength = 4;
        sequenceInput.placeholder = '请输入4位数字(1-7)';
    } else {
        sequenceInput.placeholder = '请先选择研发类型';
    }
    
    // 清空当前输入
    sequenceInput.value = '';
}

// 验证序列输入
function validateSequenceInput(event) {
    const input = event.target;
    const value = input.value;
    const researchType = document.getElementById('research-type')?.value;
    
    // 只允许输入1-7的数字
    const validValue = value.replace(/[^1-7]/g, '');
    
    // 限制长度
    let maxLength = 0;
    if (researchType === '基础') maxLength = 3;
    else if (researchType === '深度') maxLength = 4;
    
    if (maxLength > 0 && validValue.length > maxLength) {
        input.value = validValue.substring(0, maxLength);
    } else {
        input.value = validValue;
    }
}

// 分析序列模式
function analyzeSequencePattern(sequence) {
    const digits = sequence.split('').map(Number);
    const counts = {};
    
    // 统计每个数字出现的次数
    digits.forEach(digit => {
        counts[digit] = (counts[digit] || 0) + 1;
    });
    
    const countValues = Object.values(counts).sort((a, b) => b - a);
    
    if (sequence.length === 3) {
        // 基础研发模式分析
        if (countValues[0] === 1) {
            return 'no_repeat';  // 没有重复
        } else if (countValues[0] === 2) {
            return 'one_double'; // 1个数字重复2次
        } else if (countValues[0] === 3) {
            return 'one_triple'; // 1个数字重复3次
        }
    } else if (sequence.length === 4) {
        // 深度研发模式分析
        if (countValues[0] === 1) {
            return 'no_repeat';  // 没有重复
        } else if (countValues[0] === 2 && countValues[1] === 2) {
            return 'two_double'; // 2个数字重复2次
        } else if (countValues[0] === 2 && countValues[1] === 1) {
            return 'one_double'; // 1个数字重复2次
        } else if (countValues[0] === 3) {
            return 'one_triple'; // 1个数字重复3次
        } else if (countValues[0] === 4) {
            return 'one_quadruple'; // 1个数字重复4次
        }
    }
    
    return null;
}

// 计算研发数据
function calculateTowerResearch() {
    const weaponType = document.getElementById('weapon-type')?.value;
    const weaponLevel = document.getElementById('weapon-level')?.value;
    const weaponCategory = document.getElementById('weapon-category')?.value;
    const researchType = document.getElementById('research-type')?.value;
    const targetSequence = document.getElementById('target-sequence')?.value;
    
    // 验证输入
    if (!weaponType || !weaponLevel || !weaponCategory || !researchType || !targetSequence) {
        showNotification('请填写完整的配置信息', 'warning');
        return;
    }
    
    // 验证序列格式
    const expectedLength = researchType === '基础' ? 3 : 4;
    if (targetSequence.length !== expectedLength) {
        showNotification(`${researchType}研发需要${expectedLength}位数字`, 'error');
        return;
    }
    
    if (!/^[1-7]+$/.test(targetSequence)) {
        showNotification('序列只能包含1-7的数字', 'error');
        return;
    }
    
    // 获取材料需求
    const requirements = towerSystemData.researchRequirements[weaponLevel]?.[weaponCategory]?.[researchType];
    if (!requirements) {
        showNotification('无效的配置组合', 'error');
        return;
    }
    
    // 获取元件价格
    const componentPrices = getTowerComponentPrices();
    const componentType = towerSystemData.weaponToComponent[weaponType];
    
    // 计算单次研发成本
    let singleCost = requirements.fireSource;
    
    if (requirements.basicComponent > 0) {
        singleCost += requirements.basicComponent * (componentPrices.basic || 0);
    }
    
    if (requirements.expandComponent > 0) {
        const componentPrice = componentPrices[componentType] || 0;
        singleCost += requirements.expandComponent * componentPrice;
    }
    
    // 分析序列模式并获取概率
    const pattern = analyzeSequencePattern(targetSequence);
    if (!pattern) {
        showNotification('无法分析序列模式', 'error');
        return;
    }
    
    const probability = towerSystemData.sequenceProbabilities[researchType][pattern];
    if (probability === undefined) {
        showNotification('无法获取序列概率', 'error');
        return;
    }
    
    // 计算期望成本
    const expectedCost = singleCost / (probability / 100);
    
    // 更新显示
    updateTowerResults(probability, expectedCost, singleCost);
    
    showNotification('计算完成！', 'success');
}

// 更新计算结果显示
function updateTowerResults(probability, expectedCost, singleCost) {
    const probabilityElement = document.getElementById('success-probability');
    const expectedCostElement = document.getElementById('expected-cost');
    const singleCostElement = document.getElementById('single-cost');
    
    if (probabilityElement) {
        probabilityElement.textContent = `${probability.toFixed(2)}%`;
    }
    
    if (expectedCostElement) {
        expectedCostElement.textContent = `${expectedCost.toFixed(1)} 初火源质`;
    }
    
    if (singleCostElement) {
        singleCostElement.textContent = `${singleCost.toFixed(1)} 初火源质`;
    }
}

// 保存元件价格到本地存储
function saveTowerComponentPrices() {
    const prices = {
        basic: parseFloat(document.getElementById('basic-component-price')?.value) || 0,
        caster: parseFloat(document.getElementById('caster-component-price')?.value) || 0,
        guard: parseFloat(document.getElementById('guard-component-price')?.value) || 0,
        sniper: parseFloat(document.getElementById('sniper-component-price')?.value) || 0,
        defense: parseFloat(document.getElementById('defense-component-price')?.value) || 0
    };
    
    localStorage.setItem('towerComponentPrices', JSON.stringify(prices));
}

// 从本地存储加载元件价格
function loadTowerComponentPrices() {
    try {
        const saved = localStorage.getItem('towerComponentPrices');
        if (saved) {
            const prices = JSON.parse(saved);
            
            if (prices.basic) document.getElementById('basic-component-price').value = prices.basic;
            if (prices.caster) document.getElementById('caster-component-price').value = prices.caster;
            if (prices.guard) document.getElementById('guard-component-price').value = prices.guard;
            if (prices.sniper) document.getElementById('sniper-component-price').value = prices.sniper;
            if (prices.defense) document.getElementById('defense-component-price').value = prices.defense;
        }
    } catch (error) {
        console.warn('加载元件价格失败:', error);
    }
}

// 获取当前元件价格
function getTowerComponentPrices() {
    return {
        basic: parseFloat(document.getElementById('basic-component-price')?.value) || 0,
        caster: parseFloat(document.getElementById('caster-component-price')?.value) || 0,
        guard: parseFloat(document.getElementById('guard-component-price')?.value) || 0,
        sniper: parseFloat(document.getElementById('sniper-component-price')?.value) || 0,
        defense: parseFloat(document.getElementById('defense-component-price')?.value) || 0
    };
}

// 统一数据持久化系统 - 使用服务器API替代localStorage
const DataPersistence = {
    // 缓存数据
    cachedData: {},
    
    // API调用方法
    async saveToServer(data) {
        try {
            const response = await fetch('/api/save-data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            if (!result.success) {
                console.error('保存数据失败:', result.error);
            }
            return result.success;
        } catch (error) {
            console.error('保存数据时发生错误:', error);
            return false;
        }
    },
    
    async loadFromServer() {
        try {
            const response = await fetch('/api/load-data');
            const result = await response.json();
            if (result.success) {
                this.cachedData = result.data || {};
                return this.cachedData;
            } else {
                console.error('加载数据失败:', result.error);
                return {};
            }
        } catch (error) {
            console.error('加载数据时发生错误:', error);
            return {};
        }
    },
    
    // 保存所有系统数据
    async saveAllData() {
        const allData = {
            crafting: this.getCraftingData(),
            damage: this.getDamageData(),
            dream: this.getDreamData(),
            skill: this.getSkillData(),
            seal: this.getSealData(),
            tower: this.getTowerData()
        };
        return await this.saveToServer(allData);
    },

    // 加载所有系统数据
    async loadAllData() {
        const data = await this.loadFromServer();
        if (data.crafting) this.setCraftingData(data.crafting);
        if (data.damage) this.setDamageData(data.damage);
        if (data.dream) this.setDreamData(data.dream);
        if (data.skill) this.setSkillData(data.skill);
        if (data.seal) this.setSealData(data.seal);
        if (data.tower) this.setTowerData(data.tower);
    },

    // 打造系统数据获取
    getCraftingData() {
        return {
            weaponType: document.querySelector('input[name="weapon-type"]:checked')?.value || '',
            itemLevel: document.getElementById('item-level')?.value || '',
            targetAffixes: document.getElementById('target-affixes')?.value || '',
            t0Upgrade: document.querySelector('select[name="t0-upgrade"]')?.value || '0',
            t1Upgrade: document.querySelector('select[name="t1-upgrade"]')?.value || '0',
            t2Upgrade: document.querySelector('select[name="t2-upgrade"]')?.value || '0',
            lingsha: document.getElementById('lingsha-price')?.value || '',
            zhengui: document.getElementById('zhengui-price')?.value || '',
            xishi: document.getElementById('xishi-price')?.value || '',
            zhizhen: document.getElementById('zhizhen-price')?.value || '',
            shensheng: document.getElementById('shensheng-price')?.value || ''
        };
    },

    // 打造系统数据设置
    setCraftingData(data) {
        if (!data) return;
        
        // 恢复武器类型
        if (data.weaponType) {
            const weaponRadio = document.querySelector(`input[name="weapon-type"][value="${data.weaponType}"]`);
            if (weaponRadio) weaponRadio.checked = true;
        }
        
        // 恢复其他字段
        if (data.itemLevel) {
            const itemLevelEl = document.getElementById('item-level');
            if (itemLevelEl) itemLevelEl.value = data.itemLevel;
        }
        if (data.targetAffixes) {
            const targetAffixesEl = document.getElementById('target-affixes');
            if (targetAffixesEl) targetAffixesEl.value = data.targetAffixes;
        }
        
        // 恢复升级选择
        const t0Select = document.querySelector('select[name="t0-upgrade"]');
        const t1Select = document.querySelector('select[name="t1-upgrade"]');
        const t2Select = document.querySelector('select[name="t2-upgrade"]');
        if (t0Select && data.t0Upgrade) t0Select.value = data.t0Upgrade;
        if (t1Select && data.t1Upgrade) t1Select.value = data.t1Upgrade;
        if (t2Select && data.t2Upgrade) t2Select.value = data.t2Upgrade;
        
        // 恢复材料价格
        const priceFields = ['lingsha', 'zhengui', 'xishi', 'zhizhen', 'shensheng'];
        priceFields.forEach(field => {
            if (data[field]) {
                const element = document.getElementById(`${field}-price`);
                if (element) element.value = data[field];
            }
        });
    },

    // 伤害系统数据获取
    getDamageData() {
        const data = {
            // 减伤计算数据
            drRows: [],
            // 倍率伤害数据
            baseDamage: document.getElementById('base-damage')?.value || '',
            damageMultiplier: document.getElementById('damage-multiplier')?.value || '',
            // 伤害提升数据
            currentDamage: document.getElementById('current-damage')?.value || '',
            targetDamage: document.getElementById('target-damage')?.value || ''
        };
        
        // 获取减伤行数据
        const drRows = document.querySelectorAll('.dr-row');
        drRows.forEach((row, index) => {
            const typeSelect = row.querySelector('.dr-type');
            const valueInput = row.querySelector('.dr-value');
            if (typeSelect && valueInput) {
                data.drRows.push({
                    type: typeSelect.value,
                    value: valueInput.value
                });
            }
        });
        
        return data;
    },

    // 伤害系统数据设置
    setDamageData(data) {
        if (!data) return;
        
        // 恢复倍率伤害数据
        if (data.baseDamage) {
            const baseDamageEl = document.getElementById('base-damage');
            if (baseDamageEl) baseDamageEl.value = data.baseDamage;
        }
        if (data.damageMultiplier) {
            const damageMultiplierEl = document.getElementById('damage-multiplier');
            if (damageMultiplierEl) damageMultiplierEl.value = data.damageMultiplier;
        }
        
        // 恢复伤害提升数据
        if (data.currentDamage) {
            const currentDamageEl = document.getElementById('current-damage');
            if (currentDamageEl) currentDamageEl.value = data.currentDamage;
        }
        if (data.targetDamage) {
            const targetDamageEl = document.getElementById('target-damage');
            if (targetDamageEl) targetDamageEl.value = data.targetDamage;
        }
        
        // 恢复减伤行数据
        if (data.drRows && data.drRows.length > 0) {
            const drRows = document.querySelectorAll('.dr-row');
            data.drRows.forEach((rowData, index) => {
                if (drRows[index]) {
                    const typeSelect = drRows[index].querySelector('.dr-type');
                    const valueInput = drRows[index].querySelector('.dr-value');
                    if (typeSelect && rowData.type) typeSelect.value = rowData.type;
                    if (valueInput && rowData.value) valueInput.value = rowData.value;
                }
            });
        }
    },

    // 解梦系统数据获取
    getDreamData() {
        return {
            equipmentType: document.querySelector('input[name="equipment-type"]:checked')?.value || '',
            itemType: document.getElementById('item-type')?.value || '',
            itemLevel: document.getElementById('dream-item-level')?.value || '',
            targetAffixes: document.getElementById('dream-target-affixes')?.value || '',
            weaponPrice: document.getElementById('dream-weapon-price')?.value || '',
            accessoryPrice: document.getElementById('dream-accessory-price')?.value || ''
        };
    },

    // 解梦系统数据设置
    setDreamData(data) {
        if (!data) return;
        
        // 恢复装备类型
        if (data.equipmentType) {
            const equipmentRadio = document.querySelector(`input[name="equipment-type"][value="${data.equipmentType}"]`);
            if (equipmentRadio) equipmentRadio.checked = true;
        }
        
        // 恢复其他字段
        if (data.itemType) {
            const itemTypeEl = document.getElementById('item-type');
            if (itemTypeEl) itemTypeEl.value = data.itemType;
        }
        if (data.itemLevel) {
            const itemLevelEl = document.getElementById('dream-item-level');
            if (itemLevelEl) itemLevelEl.value = data.itemLevel;
        }
        if (data.targetAffixes) {
            const targetAffixesEl = document.getElementById('dream-target-affixes');
            if (targetAffixesEl) targetAffixesEl.value = data.targetAffixes;
        }
        
        // 恢复材料价格
        if (data.weaponPrice) {
            const weaponPriceEl = document.getElementById('dream-weapon-price');
            if (weaponPriceEl) weaponPriceEl.value = data.weaponPrice;
        }
        if (data.accessoryPrice) {
            const accessoryPriceEl = document.getElementById('dream-accessory-price');
            if (accessoryPriceEl) accessoryPriceEl.value = data.accessoryPrice;
        }
    },

    // 技能系统数据获取
    getSkillData() {
        return {
            currentLevel: document.getElementById('current-level')?.value || '',
            targetLevel: document.getElementById('target-level')?.value || '',
            inspirationPrice: document.getElementById('inspiration-price')?.value || '',
            t0Quantity: document.getElementById('t0-quantity')?.value || '',
            t0Price: document.getElementById('t0-price')?.value || '',
            t1Quantity: document.getElementById('t1-quantity')?.value || '',
            t1Price: document.getElementById('t1-price')?.value || '',
            t2Quantity: document.getElementById('t2-quantity')?.value || '',
            t2Price: document.getElementById('t2-price')?.value || ''
        };
    },

    // 技能系统数据设置
    setSkillData(data) {
        if (!data) return;
        
        const fields = [
            'current-level', 'target-level', 'inspiration-price',
            't0-quantity', 't0-price', 't1-quantity', 't1-price', 't2-quantity', 't2-price'
        ];
        
        const dataKeys = [
            'currentLevel', 'targetLevel', 'inspirationPrice',
            't0Quantity', 't0Price', 't1Quantity', 't1Price', 't2Quantity', 't2Price'
        ];
        
        fields.forEach((fieldId, index) => {
            const dataKey = dataKeys[index];
            if (data[dataKey]) {
                const element = document.getElementById(fieldId);
                if (element) element.value = data[dataKey];
            }
        });
    },

    // 封印系统数据获取
    getSealData() {
        const data = {
            equipmentSealCompensation: document.getElementById('equipment-seal-compensation')?.value || '',
            otherSealCompensation: document.getElementById('other-seal-compensation')?.value || '',
            haloData: []
        };
        
        // 获取4个光环的数据
        for (let i = 1; i <= 4; i++) {
            const haloData = {
                baseSeal: document.getElementById(`base-seal-${i}`)?.value || '0',
                sealType: document.getElementById(`seal-type-${i}`)?.value || '',
                pathfinderSlots: document.getElementById(`pathfinder-slots-${i}`)?.value || '',
                conversionSkill: document.getElementById(`conversion-skill-${i}`)?.value || '',
                conversionLevel: document.getElementById(`conversion-level-${i}`)?.value || '',
                supportSkills: []
            };
            
            // 获取辅助技能数据（每个光环有4个辅助技能）
            for (let j = 1; j <= 4; j++) {
                const skillSelect = document.getElementById(`support-skill-${i}-${j}`);
                const levelInput = document.getElementById(`support-level-${i}-${j}`);
                
                if (skillSelect && levelInput) {
                    haloData.supportSkills.push({
                        skill: skillSelect.value || '',
                        level: levelInput.value || '20'
                    });
                }
            }
            
            data.haloData.push(haloData);
        }
        
        return data;
    },

    // 封印系统数据设置
    setSealData(data) {
        if (!data) return;
        
        if (data.equipmentSealCompensation) {
            const equipmentSealEl = document.getElementById('equipment-seal-compensation');
            if (equipmentSealEl) equipmentSealEl.value = data.equipmentSealCompensation;
        }
        if (data.otherSealCompensation) {
            const otherSealEl = document.getElementById('other-seal-compensation');
            if (otherSealEl) otherSealEl.value = data.otherSealCompensation;
        }
        
        // 恢复光环数据
        if (data.haloData) {
            data.haloData.forEach((haloData, index) => {
                const i = index + 1;
                
                // 恢复基础封印数值
                if (haloData.baseSeal !== undefined) {
                    const baseSealInput = document.getElementById(`base-seal-${i}`);
                    if (baseSealInput) baseSealInput.value = haloData.baseSeal;
                }
                
                // 恢复封印类型
                if (haloData.sealType) {
                    const sealTypeSelect = document.getElementById(`seal-type-${i}`);
                    if (sealTypeSelect) {
                        sealTypeSelect.value = haloData.sealType;
                        // 手动触发显示逻辑
                        const conversionGroup = document.getElementById(`conversion-group-${i}`);
                        if (conversionGroup) {
                            if (haloData.sealType === 'life') {
                                conversionGroup.style.display = 'block';
                            } else {
                                conversionGroup.style.display = 'none';
                            }
                        }
                    }
                }
                
                // 恢复独辟蹊径空位
                if (haloData.pathfinderSlots) {
                    const pathfinderSelect = document.getElementById(`pathfinder-slots-${i}`);
                    if (pathfinderSelect) pathfinderSelect.value = haloData.pathfinderSlots;
                }
                
                // 恢复封印转化技能
                if (haloData.conversionSkill) {
                    const conversionSelect = document.getElementById(`conversion-skill-${i}`);
                    if (conversionSelect) conversionSelect.value = haloData.conversionSkill;
                }
                
                // 恢复封印转化等级
                if (haloData.conversionLevel) {
                    const conversionLevel = document.getElementById(`conversion-level-${i}`);
                    if (conversionLevel) conversionLevel.value = haloData.conversionLevel;
                }
                
                // 恢复辅助技能数据
                if (haloData.supportSkills && Array.isArray(haloData.supportSkills)) {
                    haloData.supportSkills.forEach((skillData, skillIndex) => {
                        const j = skillIndex + 1;
                        if (j <= 4) { // 确保不超过4个辅助技能
                            const skillSelect = document.getElementById(`support-skill-${i}-${j}`);
                            const levelInput = document.getElementById(`support-level-${i}-${j}`);
                            
                            if (skillSelect && skillData.skill) {
                                skillSelect.value = skillData.skill;
                            }
                            if (levelInput && skillData.level) {
                                levelInput.value = skillData.level;
                            }
                        }
                    });
                }
            });
        }
    },

    // 高塔系统数据获取
    getTowerData() {
        return {
            weaponType: document.querySelector('#tower #weapon-type')?.value || '',
            weaponLevel: document.querySelector('#tower #weapon-level')?.value || '',
            weaponCategory: document.querySelector('#tower #weapon-category')?.value || '',
            researchType: document.getElementById('research-type')?.value || '',
            sequenceInput: document.getElementById('sequence-input')?.value || '',
            basicComponentPrice: document.getElementById('basic-component-price')?.value || '',
            casterComponentPrice: document.getElementById('caster-component-price')?.value || '',
            guardComponentPrice: document.getElementById('guard-component-price')?.value || '',
            sniperComponentPrice: document.getElementById('sniper-component-price')?.value || '',
            defenseComponentPrice: document.getElementById('defense-component-price')?.value || ''
        };
    },

    // 高塔系统数据设置
    setTowerData(data) {
        if (!data) return;
        
        const towerWeaponType = document.querySelector('#tower #weapon-type');
        if (towerWeaponType && data.weaponType) towerWeaponType.value = data.weaponType;
        
        const towerWeaponLevel = document.querySelector('#tower #weapon-level');
        if (towerWeaponLevel && data.weaponLevel) towerWeaponLevel.value = data.weaponLevel;
        
        const towerWeaponCategory = document.querySelector('#tower #weapon-category');
        if (towerWeaponCategory && data.weaponCategory) towerWeaponCategory.value = data.weaponCategory;
        
        const componentFields = [
            { key: 'researchType', id: 'research-type' },
            { key: 'sequenceInput', id: 'sequence-input' },
            { key: 'basicComponentPrice', id: 'basic-component-price' },
            { key: 'casterComponentPrice', id: 'caster-component-price' },
            { key: 'guardComponentPrice', id: 'guard-component-price' },
            { key: 'sniperComponentPrice', id: 'sniper-component-price' },
            { key: 'defenseComponentPrice', id: 'defense-component-price' }
        ];
        
        componentFields.forEach(field => {
            if (data[field.key]) {
                const element = document.getElementById(field.id);
                if (element) element.value = data[field.key];
            }
        });
    }
};

// 自动保存功能
function setupAutoSave() {
    // 为所有输入框添加自动保存事件
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('change', () => {
            // 延迟保存，避免频繁操作
            clearTimeout(window.autoSaveTimeout);
            window.autoSaveTimeout = setTimeout(async () => {
                try {
                    await DataPersistence.saveAllData();
                    console.log('数据已自动保存');
                } catch (error) {
                    console.error('自动保存失败:', error);
                }
            }, 1000);
        });
    });
    
    // 页面卸载时保存数据
    window.addEventListener('beforeunload', () => {
        // 使用同步方式保存，确保在页面关闭前完成
        navigator.sendBeacon('/api/save-data', JSON.stringify({
            crafting: DataPersistence.getCraftingData(),
            damage: DataPersistence.getDamageData(),
            dream: DataPersistence.getDreamData(),
            skill: DataPersistence.getSkillData(),
            seal: DataPersistence.getSealData(),
            tower: DataPersistence.getTowerData()
        }));
    });
}

// 在DOM加载完成后初始化数据持久化
document.addEventListener('DOMContentLoaded', function() {
    // 延迟加载数据，确保DOM完全加载
    setTimeout(async () => {
        try {
            await DataPersistence.loadAllData();
            setupAutoSave();
            console.log('数据持久化系统已初始化');
        } catch (error) {
            console.error('数据加载失败:', error);
            setupAutoSave(); // 即使加载失败也要启用自动保存
        }
    }, 1000);
});

console.log('火炬之光无限计算器已加载完成！');
console.log('快捷键：Ctrl+Enter 执行计算，Ctrl+S 导出数据');
console.log('高塔系统功能已启用！');
console.log('数据持久化功能已启用！');

// 主题切换功能
class ThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('torch-calculator-theme') || 'light';
        this.themeSwitch = null;
        this.init();
    }

    init() {
        // 等待DOM加载完成后初始化
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupThemeToggle());
        } else {
            this.setupThemeToggle();
        }
        
        // 应用保存的主题
        this.applyTheme(this.currentTheme);
    }

    setupThemeToggle() {
        this.themeSwitch = document.getElementById('theme-switch');
        if (!this.themeSwitch) {
            console.warn('主题切换开关未找到');
            return;
        }

        // 设置初始状态
        this.themeSwitch.checked = this.currentTheme === 'dark';

        // 添加事件监听器
        this.themeSwitch.addEventListener('change', (e) => {
            const newTheme = e.target.checked ? 'dark' : 'light';
            this.switchTheme(newTheme);
        });

        console.log('主题切换功能已初始化');
    }

    switchTheme(theme) {
        this.currentTheme = theme;
        this.applyTheme(theme);
        this.saveTheme(theme);
        
        // 显示切换通知
        const themeText = theme === 'dark' ? '深色模式' : '浅色模式';
        if (typeof showNotification === 'function') {
            showNotification(`已切换到${themeText}`, 'success');
        }
    }

    applyTheme(theme) {
        const html = document.documentElement;
        if (theme === 'dark') {
            html.setAttribute('data-theme', 'dark');
        } else {
            html.removeAttribute('data-theme');
        }
    }

    saveTheme(theme) {
        localStorage.setItem('torch-calculator-theme', theme);
    }

    getCurrentTheme() {
        return this.currentTheme;
    }

    // 检测系统主题偏好
    detectSystemTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }

    // 监听系统主题变化
    watchSystemTheme() {
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addEventListener('change', (e) => {
                if (!localStorage.getItem('torch-calculator-theme')) {
                    const systemTheme = e.matches ? 'dark' : 'light';
                    this.switchTheme(systemTheme);
                    if (this.themeSwitch) {
                        this.themeSwitch.checked = systemTheme === 'dark';
                    }
                }
            });
        }
    }
}

// 初始化主题管理器
const themeManager = new ThemeManager();

// 启用系统主题监听
themeManager.watchSystemTheme();

console.log('主题切换功能已启用！');

// 侧边栏折叠功能
class SidebarManager {
    constructor() {
        this.sidebar = document.querySelector('.sidebar');
        this.toggleButton = document.getElementById('sidebar-toggle');
        this.isCollapsed = false;
        this.init();
    }

    init() {
        // 从本地存储加载折叠状态
        const savedState = localStorage.getItem('torch-calculator-sidebar-collapsed');
        if (savedState === 'true') {
            this.toggleSidebar(false); // false表示不保存状态，因为是从存储加载
        }

        // 设置点击事件
        if (this.toggleButton) {
            this.toggleButton.addEventListener('click', () => {
                this.toggleSidebar(true); // true表示保存状态
            });
        }
    }

    toggleSidebar(saveState = true) {
        if (!this.sidebar) return;

        this.isCollapsed = !this.isCollapsed;
        
        if (this.isCollapsed) {
            this.sidebar.classList.add('collapsed');
        } else {
            this.sidebar.classList.remove('collapsed');
        }

        // 保存状态到本地存储
        if (saveState) {
            localStorage.setItem('torch-calculator-sidebar-collapsed', this.isCollapsed.toString());
        }

        // 触发窗口resize事件，以便其他组件可以响应布局变化
        window.dispatchEvent(new Event('resize'));
    }

    getSidebarState() {
        return {
            isCollapsed: this.isCollapsed,
            width: this.isCollapsed ? 70 : 200
        };
    }
}

// 初始化侧边栏管理器
const sidebarManager = new SidebarManager();

console.log('侧边栏折叠功能已启用！');