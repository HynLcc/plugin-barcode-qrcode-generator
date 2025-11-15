/**
 * JsBarcode valid() 方法测试脚本
 * 用于验证 JsBarcode 的 valid() 方法的工作方式
 * 
 * 运行方式: node scripts/test-jsbarcode-valid.js
 * 
 * 注意：需要先安装 canvas 和 jsdom（如果需要实际生成条码）
 * npm install canvas jsdom
 */

const JsBarcode = require('jsbarcode');

// 尝试设置 JSDOM 环境（如果可用）
try {
  const { JSDOM } = require('jsdom');
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'http://localhost',
    pretendToBeVisual: true,
    resources: 'usable'
  });

  global.window = dom.window;
  global.document = dom.window.document;
  global.navigator = dom.window.navigator;
  
  // 尝试加载 canvas（如果可用）
  try {
    const { createCanvas } = require('canvas');
    const realCreateElement = dom.window.document.createElement.bind(dom.window.document);
    dom.window.document.createElement = function(tag) {
      if (tag === 'canvas') {
        return createCanvas(200, 100);
      }
      return realCreateElement(tag);
    };
  } catch (e) {
    // canvas 不可用，使用更完整的模拟 canvas
    const realCreateElement = dom.window.document.createElement.bind(dom.window.document);
    dom.window.document.createElement = function(tag) {
      if (tag === 'canvas') {
        const canvas = realCreateElement(tag);
        canvas.width = 200;
        canvas.height = 100;
        const ctx = {
          save: () => {},
          restore: () => {},
          clearRect: () => {},
          fillRect: () => {},
          fillText: () => {},
          measureText: () => ({ width: 10 }),
          beginPath: () => {},
          moveTo: () => {},
          lineTo: () => {},
          stroke: () => {},
          closePath: () => {},
          translate: () => {},
          scale: () => {},
          rotate: () => {},
          setTransform: () => {},
          canvas: canvas
        };
        canvas.getContext = () => ctx;
        return canvas;
      }
      return realCreateElement(tag);
    };
  }
} catch (e) {
  console.warn('警告: jsdom 未安装，某些测试可能无法运行');
  console.warn('安装命令: npm install --save-dev jsdom canvas');
  
  // 使用模拟的 DOM 环境
  global.document = {
    createElement: (tag) => {
      if (tag === 'canvas') {
        const canvas = {
          width: 200,
          height: 100,
          getContext: () => ({
            save: () => {},
            restore: () => {},
            clearRect: () => {},
            fillRect: () => {},
            fillText: () => {},
            measureText: () => ({ width: 10 }),
            beginPath: () => {},
            moveTo: () => {},
            lineTo: () => {},
            stroke: () => {},
            closePath: () => {},
            translate: () => {},
            scale: () => {},
            rotate: () => {},
            setTransform: () => {},
            canvas: canvas
          })
        };
        return canvas;
      }
      if (tag === 'svg') {
        return {
          setAttribute: () => {},
          appendChild: () => {},
          remove: () => {}
        };
      }
      return {};
    },
    createElementNS: (ns, tag) => {
      if (tag === 'svg') {
        return {
          setAttribute: () => {},
          appendChild: () => {},
          remove: () => {}
        };
      }
      return {};
    }
  };
}

// 测试用例配置
const testCases = [
  // EAN5 测试
  {
    format: 'EAN5',
    tests: [
      { input: '12345', expected: true, description: 'EAN5: 5位数字（有效）' },
      { input: '53', expected: false, description: 'EAN5: 2位数字（应该无效）' },
      { input: '9638507', expected: false, description: 'EAN5: 7位数字（应该无效）' },
      { input: '1234', expected: false, description: 'EAN5: 4位数字（应该无效）' },
      { input: '123456', expected: false, description: 'EAN5: 6位数字（应该无效）' },
    ]
  },
  // EAN2 测试
  {
    format: 'EAN2',
    tests: [
      { input: '53', expected: true, description: 'EAN2: 2位数字（有效）' },
      { input: '12', expected: true, description: 'EAN2: 2位数字（有效）' },
      { input: '1', expected: false, description: 'EAN2: 1位数字（应该无效）' },
      { input: '123', expected: false, description: 'EAN2: 3位数字（应该无效）' },
      { input: '12345', expected: false, description: 'EAN2: 5位数字（应该无效）' },
    ]
  },
  // EAN8 测试
  {
    format: 'EAN8',
    tests: [
      { input: '96385074', expected: true, description: 'EAN8: 8位数字（有效，包含校验位）' },
      { input: '9638507', expected: true, description: 'EAN8: 7位数字（有效，JsBarcode会自动添加校验位）' },
      { input: '12345', expected: false, description: 'EAN8: 5位数字（应该无效）' },
      { input: '123456789', expected: false, description: 'EAN8: 9位数字（应该无效）' },
    ]
  },
  // EAN13 测试
  {
    format: 'EAN13',
    tests: [
      { input: '5901234123457', expected: true, description: 'EAN13: 13位数字（有效，包含校验位）' },
      { input: '590123412345', expected: true, description: 'EAN13: 12位数字（有效，JsBarcode会自动添加校验位）' },
      { input: '12345', expected: false, description: 'EAN13: 5位数字（应该无效）' },
      { input: '12345678901234', expected: false, description: 'EAN13: 14位数字（应该无效）' },
    ]
  },
  // CODE128 测试
  {
    format: 'CODE128',
    tests: [
      { input: 'Hello123', expected: true, description: 'CODE128: ASCII字符和数字（有效）' },
      { input: 'ABC123', expected: true, description: 'CODE128: 字母和数字（有效）' },
      { input: '1234567890', expected: true, description: 'CODE128: 纯数字（有效）' },
    ]
  },
  // UPC 测试
  {
    format: 'UPC',
    tests: [
      { input: '123456789999', expected: true, description: 'UPC: 12位数字（有效，包含校验位）' },
      { input: '12345678999', expected: true, description: 'UPC: 11位数字（有效，JsBarcode会自动添加校验位）' },
      { input: '12345', expected: false, description: 'UPC: 5位数字（应该无效）' },
    ]
  },
];

// 测试格式特定的 valid() 方法（通过实际调用 JsBarcode 来测试）
function testFormatValidMethod() {
  console.log('\n========== 测试格式特定的 valid() 方法 ==========\n');
  console.log('注意：通过实际调用 JsBarcode（不提供 valid 回调）来测试 encoder.valid() 的行为\n');
  
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  testCases.forEach(({ format, tests }) => {
    console.log(`\n--- 测试格式: ${format} ---`);
    
    tests.forEach(({ input, expected, description }) => {
      totalTests++;
      
      try {
        const canvas = document.createElement('canvas');
        let isValid = null;
        let threwException = false;
        let exceptionMessage = '';

        // 通过实际调用 JsBarcode（不提供 valid 回调）来测试
        // 如果 encoder.valid() 返回 false，JsBarcode 会抛出异常
        try {
          JsBarcode(canvas, input, {
            format: format
            // 不提供 valid 回调
          });
          // 如果没有抛出异常，说明 valid() 返回了 true
          isValid = true;
        } catch (err) {
          threwException = true;
          exceptionMessage = err.message;
          // 如果抛出异常，说明 valid() 返回了 false
          isValid = false;
        }

        const result = isValid === expected;
        const status = result ? '✓ PASS' : '✗ FAIL';
        
        if (result) {
          passedTests++;
        } else {
          failedTests++;
        }

        console.log(`  ${status} ${description}`);
        console.log(`    输入: "${input}"`);
        console.log(`    期望 valid() 返回: ${expected}, 实际: ${isValid}`);
        if (threwException) {
          console.log(`    异常信息: ${exceptionMessage}`);
        }
        
        if (!result) {
          console.log(`    ⚠️  验证结果不符合预期！`);
          if (expected && !isValid) {
            console.log(`    预期：valid() 应该返回 true（数据有效），但实际返回了 false`);
          } else if (!expected && isValid) {
            console.log(`    预期：valid() 应该返回 false（数据无效），但实际返回了 true`);
          }
        }
      } catch (err) {
        failedTests++;
        console.log(`  ✗ ERROR ${description}`);
        console.log(`    输入: "${input}"`);
        console.log(`    错误: ${err.message}`);
      }
    });
  });

  console.log(`\n--- 测试总结 ---`);
  console.log(`总测试数: ${totalTests}`);
  console.log(`通过: ${passedTests}`);
  console.log(`失败: ${failedTests}`);
  console.log(`通过率: ${((passedTests / totalTests) * 100).toFixed(2)}%`);
}

// 测试不提供 valid 回调时的行为（实际调用 JsBarcode）
function testWithoutValidCallback() {
  console.log('\n\n========== 测试不提供 valid 回调时的行为 ==========\n');
  
  const testCases = [
    { format: 'EAN5', input: '12345', description: 'EAN5: 有效输入（5位）', shouldThrow: false },
    { format: 'EAN5', input: '53', description: 'EAN5: 无效输入（2位）', shouldThrow: true },
    { format: 'EAN5', input: '9638507', description: 'EAN5: 无效输入（7位）', shouldThrow: true },
    { format: 'EAN2', input: '53', description: 'EAN2: 有效输入（2位）', shouldThrow: false },
    { format: 'EAN2', input: '123', description: 'EAN2: 无效输入（3位）', shouldThrow: true },
    { format: 'EAN8', input: '96385074', description: 'EAN8: 有效输入（8位）', shouldThrow: false },
    { format: 'EAN8', input: '12345', description: 'EAN8: 无效输入（5位）', shouldThrow: true },
  ];

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  testCases.forEach(({ format, input, description, shouldThrow }) => {
    totalTests++;
    
    try {
      const canvas = document.createElement('canvas');
      let threwException = false;
      let exceptionMessage = '';
      let exceptionType = '';

      try {
        // 调用 JsBarcode，不提供 valid 回调
        // 根据源码：如果没有提供 valid 回调，!encoder.valid() 时会抛出 InvalidInputException
        JsBarcode(canvas, input, {
          format: format
          // 不提供 valid 回调
        });
      } catch (err) {
        threwException = true;
        exceptionMessage = err.message;
        exceptionType = err.constructor.name;
      }

      const result = threwException === shouldThrow;
      const status = result ? '✓ PASS' : '✗ FAIL';
      
      if (result) {
        passedTests++;
      } else {
        failedTests++;
      }

      console.log(`  ${status} ${description}`);
      console.log(`    输入: "${input}"`);
      console.log(`    期望抛出异常: ${shouldThrow}, 实际抛出异常: ${threwException}`);
      if (threwException) {
        console.log(`    异常类型: ${exceptionType}`);
        console.log(`    异常信息: ${exceptionMessage}`);
      } else {
        console.log(`    ✓ 成功生成条码（未抛出异常）`);
      }
      
      if (!result) {
        console.log(`    ⚠️  行为不符合预期！`);
        if (!shouldThrow && threwException) {
          console.log(`    预期：应该成功生成，但实际抛出了异常`);
        } else if (shouldThrow && !threwException) {
          console.log(`    预期：应该抛出异常阻止生成，但实际成功生成了`);
        }
      }
    } catch (err) {
      failedTests++;
      console.log(`  ✗ ERROR ${description}`);
      console.log(`    输入: "${input}"`);
      console.log(`    错误: ${err.message}`);
    }
  });

  console.log(`\n--- 测试总结 ---`);
  console.log(`总测试数: ${totalTests}`);
  console.log(`通过: ${passedTests}`);
  console.log(`失败: ${failedTests}`);
  console.log(`通过率: ${((passedTests / totalTests) * 100).toFixed(2)}%`);
}

// 测试提供 valid 回调时的行为（实际调用 JsBarcode）
function testWithValidCallback() {
  console.log('\n\n========== 测试提供 valid 回调时的行为 ==========\n');
  
  const testCases = [
    { format: 'EAN5', input: '12345', description: 'EAN5: 有效输入（5位）', expectedCallback: true, shouldGenerate: true },
    { format: 'EAN5', input: '53', description: 'EAN5: 无效输入（2位）', expectedCallback: false, shouldGenerate: false },
    { format: 'EAN2', input: '53', description: 'EAN2: 有效输入（2位）', expectedCallback: true, shouldGenerate: true },
    { format: 'EAN2', input: '123', description: 'EAN2: 无效输入（3位）', expectedCallback: false, shouldGenerate: false },
  ];

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  testCases.forEach(({ format, input, description, expectedCallback, shouldGenerate }) => {
    totalTests++;
    
    try {
      const canvas = document.createElement('canvas');
      let callbackCalled = false;
      let callbackValue = null;
      let threwException = false;
      let exceptionMessage = '';
      let generated = false;

      try {
        // 调用 JsBarcode，提供 valid 回调
        // 根据源码：如果提供了 valid 回调，JsBarcode 会调用回调而不是抛出异常
        JsBarcode(canvas, input, {
          format: format,
          valid: function(valid) {
            callbackCalled = true;
            callbackValue = valid;
            console.log(`    [Valid Callback] 被调用，值: ${valid}`);
          }
        });
        generated = true;
      } catch (err) {
        threwException = true;
        exceptionMessage = err.message;
      }

      const callbackResult = callbackCalled && callbackValue === expectedCallback;
      const generationResult = generated === shouldGenerate;
      const result = callbackResult && generationResult;
      const status = result ? '✓ PASS' : '✗ FAIL';
      
      if (result) {
        passedTests++;
      } else {
        failedTests++;
      }

      console.log(`  ${status} ${description}`);
      console.log(`    输入: "${input}"`);
      console.log(`    回调被调用: ${callbackCalled}`);
      if (callbackCalled) {
        console.log(`    回调值: ${callbackValue}, 期望: ${expectedCallback}`);
      }
      console.log(`    是否生成条码: ${generated}, 期望: ${shouldGenerate}`);
      if (threwException) {
        console.log(`    异常: ${exceptionMessage}`);
      }
      
      if (!result) {
        console.log(`    ⚠️  行为不符合预期！`);
        if (!callbackResult) {
          console.log(`    回调行为不符合预期`);
        }
        if (!generationResult) {
          console.log(`    生成行为不符合预期`);
        }
      }
    } catch (err) {
      failedTests++;
      console.log(`  ✗ ERROR ${description}`);
      console.log(`    输入: "${input}"`);
      console.log(`    错误: ${err.message}`);
    }
  });

  console.log(`\n--- 测试总结 ---`);
  console.log(`总测试数: ${totalTests}`);
  console.log(`通过: ${passedTests}`);
  console.log(`失败: ${failedTests}`);
  console.log(`通过率: ${((passedTests / totalTests) * 100).toFixed(2)}%`);
}

// 运行所有测试
function runAllTests() {
  console.log('========================================');
  console.log('JsBarcode valid() 方法测试');
  console.log('========================================');
  
  testFormatValidMethod();
  testWithoutValidCallback();
  testWithValidCallback();
  
  console.log('\n\n========================================');
  console.log('所有测试完成');
  console.log('========================================\n');
}

// 执行测试
runAllTests();

