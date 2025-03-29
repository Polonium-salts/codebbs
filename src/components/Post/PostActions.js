// 删除帖子
const handleDelete = async () => {
  // 先确认是否真的要删除
  if (!window.confirm('确定要删除这篇帖子吗？')) {
    return;
  }
  
  try {
    setIsDeleting(true);
    const response = await fetch(`/api/posts/${post.id}`, {
      method: 'DELETE',
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || data.message || '删除失败');
    }
    
    // 删除成功后的处理
    toast.success('帖子已成功删除');
    // 跳转回首页或列表页
    router.push('/');
  } catch (error) {
    console.error('删除帖子时出错:', error);
    toast.error(error.message || '删除帖子时出错，请稍后再试');
  } finally {
    setIsDeleting(false);
  }
}; 