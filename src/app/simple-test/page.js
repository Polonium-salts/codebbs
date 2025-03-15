export default function SimpleTest() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">简单 DaisyUI 测试</h1>
      
      <div className="flex flex-wrap gap-4 mb-8">
        <button className="btn">默认按钮</button>
        <button className="btn btn-primary">主要按钮</button>
        <button className="btn btn-secondary">次要按钮</button>
      </div>
      
      <div className="alert alert-info mb-8">
        <span>这是一个信息提示框</span>
      </div>
      
      <div className="card bg-base-100 shadow-xl w-96">
        <div className="card-body">
          <h2 className="card-title">卡片标题</h2>
          <p>这是一个简单的卡片内容。</p>
          <div className="card-actions justify-end">
            <button className="btn btn-primary">确认</button>
          </div>
        </div>
      </div>
    </div>
  );
} 