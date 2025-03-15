export default function DaisyUITest() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">DaisyUI 组件测试页面</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">按钮测试</h2>
            <div className="flex flex-wrap gap-2 my-4">
              <button className="btn">Default</button>
              <button className="btn btn-primary">Primary</button>
              <button className="btn btn-secondary">Secondary</button>
              <button className="btn btn-accent">Accent</button>
              <button className="btn btn-ghost">Ghost</button>
              <button className="btn btn-link">Link</button>
            </div>
            <div className="flex flex-wrap gap-2 my-4">
              <button className="btn btn-info">Info</button>
              <button className="btn btn-success">Success</button>
              <button className="btn btn-warning">Warning</button>
              <button className="btn btn-error">Error</button>
            </div>
            <div className="flex flex-wrap gap-2 my-4">
              <button className="btn btn-outline">Outline</button>
              <button className="btn btn-primary btn-outline">Primary</button>
              <button className="btn btn-secondary btn-outline">Secondary</button>
            </div>
            <div className="flex flex-wrap gap-2 my-4">
              <button className="btn btn-sm">Small</button>
              <button className="btn">Normal</button>
              <button className="btn btn-lg">Large</button>
            </div>
          </div>
        </div>
        
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">警告框测试</h2>
            <div className="flex flex-col gap-4 my-4">
              <div className="alert">
                <span>Default Alert</span>
              </div>
              <div className="alert alert-info">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <span>Info Alert</span>
              </div>
              <div className="alert alert-success">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span>Success Alert</span>
              </div>
              <div className="alert alert-warning">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                <span>Warning Alert</span>
              </div>
              <div className="alert alert-error">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span>Error Alert</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">徽章测试</h2>
            <div className="flex flex-wrap gap-2 my-4">
              <div className="badge">Default</div>
              <div className="badge badge-primary">Primary</div>
              <div className="badge badge-secondary">Secondary</div>
              <div className="badge badge-accent">Accent</div>
              <div className="badge badge-outline">Outline</div>
              <div className="badge badge-info">Info</div>
              <div className="badge badge-success">Success</div>
              <div className="badge badge-warning">Warning</div>
              <div className="badge badge-error">Error</div>
            </div>
          </div>
        </div>
        
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">进度条测试</h2>
            <div className="flex flex-col gap-4 my-4">
              <progress className="progress" value="0" max="100"></progress>
              <progress className="progress" value="25" max="100"></progress>
              <progress className="progress progress-primary" value="40" max="100"></progress>
              <progress className="progress progress-secondary" value="60" max="100"></progress>
              <progress className="progress progress-accent" value="80" max="100"></progress>
              <progress className="progress progress-info" value="90" max="100"></progress>
              <progress className="progress progress-success" value="100" max="100"></progress>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 