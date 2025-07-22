#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
火炬计算器 - Python Web服务器版本
用于将Web应用打包成exe文件
优化跨平台兼容性
"""

import os
import sys
import webbrowser
import threading
import time
import socket
import json
from flask import Flask, send_from_directory, send_file, request, jsonify

# 获取应用程序目录
if getattr(sys, 'frozen', False):
    # 如果是打包后的exe文件
    application_path = sys._MEIPASS
    # 数据存储在exe同目录下，避免临时文件夹问题
    data_path = os.path.dirname(sys.executable)
else:
    # 如果是开发环境
    application_path = os.path.dirname(os.path.abspath(__file__))
    data_path = application_path

# 确保路径存在
if not os.path.exists(application_path):
    print(f"错误: 应用程序路径不存在: {application_path}")
    sys.exit(1)

# 确保数据目录存在
if not os.path.exists(data_path):
    os.makedirs(data_path, exist_ok=True)

# 数据文件路径
DATA_FILE = os.path.join(data_path, 'torch_calculator_data.json')

app = Flask(__name__)
# 禁用Flask的调试模式和自动重载
app.config['DEBUG'] = False
app.config['TESTING'] = False

@app.route('/')
def index():
    """主页"""
    return send_file(os.path.join(application_path, 'index.html'))

@app.route('/<path:filename>')
def static_files(filename):
    """静态文件服务"""
    return send_from_directory(application_path, filename)

@app.route('/页签/<path:filename>')
def page_files(filename):
    """页签文件服务"""
    return send_from_directory(os.path.join(application_path, '页签'), filename)

@app.route('/api/save-data', methods=['POST'])
def save_data():
    """保存用户数据"""
    try:
        data = request.get_json()
        if data is None:
            return jsonify({'success': False, 'error': '无效的数据格式'}), 400
        
        # 读取现有数据
        existing_data = {}
        if os.path.exists(DATA_FILE):
            try:
                with open(DATA_FILE, 'r', encoding='utf-8') as f:
                    existing_data = json.load(f)
            except (json.JSONDecodeError, IOError):
                existing_data = {}
        
        # 更新数据
        existing_data.update(data)
        
        # 保存数据
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(existing_data, f, ensure_ascii=False, indent=2)
        
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/load-data', methods=['GET'])
def load_data():
    """加载用户数据"""
    try:
        if os.path.exists(DATA_FILE):
            with open(DATA_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
            return jsonify({'success': True, 'data': data})
        else:
            return jsonify({'success': True, 'data': {}})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

def find_free_port(start_port=5000):
    """查找可用端口"""
    for port in range(start_port, start_port + 100):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('localhost', port))
                return port
        except OSError:
            continue
    return None

def open_browser(port):
    """延迟打开浏览器"""
    time.sleep(2.0)  # 增加延迟确保服务器启动完成
    try:
        webbrowser.open(f'http://localhost:{port}')
    except Exception as e:
        print(f"无法自动打开浏览器: {e}")
        print(f"请手动访问: http://localhost:{port}")

def main():
    """主函数"""
    print("="*50)
    print("火炬之光无限 - 计算辅助工具")
    print("="*50)
    
    # 检查必要文件是否存在
    required_files = ['index.html', 'styles.css', 'script.js']
    missing_files = []
    for file in required_files:
        if not os.path.exists(os.path.join(application_path, file)):
            missing_files.append(file)
    
    if missing_files:
        print(f"错误: 缺少必要文件: {', '.join(missing_files)}")
        print(f"应用程序路径: {application_path}")
        input("按回车键退出...")
        return
    
    # 查找可用端口
    port = find_free_port()
    if port is None:
        print("错误: 无法找到可用端口")
        input("按回车键退出...")
        return
    
    print("正在启动服务器...")
    print(f"服务器地址: http://localhost:{port}")
    print("按 Ctrl+C 退出程序")
    print("="*50)
    
    # 在新线程中打开浏览器
    browser_thread = threading.Thread(target=open_browser, args=(port,))
    browser_thread.daemon = True
    browser_thread.start()
    
    try:
        # 启动Flask服务器
        app.run(host='localhost', port=port, debug=False, use_reloader=False, threaded=True)
    except KeyboardInterrupt:
        print("\n程序已退出")
    except Exception as e:
        print(f"启动失败: {e}")
        print(f"应用程序路径: {application_path}")
        print(f"当前工作目录: {os.getcwd()}")
        input("按回车键退出...")

if __name__ == '__main__':
    main()