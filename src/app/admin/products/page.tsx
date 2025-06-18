"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowLeft,
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  AlertTriangle,
  Loader2,
  Filter,
  Check,
  X
} from 'lucide-react';

interface Brand {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  samplePrice: number;
  imageUrl: string;
  stock: number;
  sampleStock: number;
  isActive: boolean;
  brand: Brand;
  createdAt: string;
  updatedAt: string;
}

interface EditingProduct {
  id?: string;
  name: string;
  description: string;
  price: number;
  samplePrice: number;
  imageUrl: string;
  stock: number;
  sampleStock: number;
  isActive: boolean;
  brandId: string;
}

export default function ProductsManagement() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<EditingProduct | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login');
      return;
    }

    checkAdminAccess();
  }, [session, status, router]);

  const checkAdminAccess = async () => {
    try {
      const response = await fetch('/api/auth/check-admin');
      if (!response.ok) {
        router.push('/');
        return;
      }
      setLoading(false);
      fetchProducts();
      fetchBrands();
    } catch (error) {
      console.error('Admin access check failed:', error);
      router.push('/');
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/admin/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const fetchBrands = async () => {
    try {
      const response = await fetch('/api/brands');
      if (response.ok) {
        const data = await response.json();
        setBrands(data);
      }
    } catch (error) {
      console.error('Failed to fetch brands:', error);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      samplePrice: product.samplePrice,
      imageUrl: product.imageUrl,
      stock: product.stock,
      sampleStock: product.sampleStock,
      isActive: product.isActive,
      brandId: product.brand.id
    });
    setIsEditModalOpen(true);
  };

  const handleAdd = () => {
    setEditingProduct({
      name: '',
      description: '',
      price: 0,
      samplePrice: 0,
      imageUrl: '',
      stock: 0,
      sampleStock: 0,
      isActive: true,
      brandId: ''
    });
    setIsEditModalOpen(true);
  };

  const handleSave = async () => {
    if (!editingProduct) return;

    setIsSubmitting(true);
    try {
      const url = editingProduct.id 
        ? `/api/admin/products/${editingProduct.id}`
        : '/api/admin/products';
      
      const method = editingProduct.id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingProduct)
      });

      if (response.ok) {
        await fetchProducts();
        setIsEditModalOpen(false);
        setEditingProduct(null);
      } else {
        const error = await response.json();
        alert(error.error || '保存に失敗しました');
      }
    } catch (error) {
      console.error('Failed to save product:', error);
      alert('保存に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (productId: string) => {
    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchProducts();
        setDeleteConfirm(null);
      } else {
        const error = await response.json();
        alert(error.error || '削除に失敗しました');
      }
    } catch (error) {
      console.error('Failed to delete product:', error);
      alert('削除に失敗しました');
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.brand.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBrand = !selectedBrand || product.brand.id === selectedBrand;
    const matchesActive = !showActiveOnly || product.isActive;
    
    return matchesSearch && matchesBrand && matchesActive;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/admin" className="mr-4">
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">商品管理</h1>
                <p className="text-gray-600">商品の追加・編集・削除・在庫管理</p>
              </div>
            </div>
            <button
              onClick={handleAdd}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              新規商品追加
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                商品検索
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="商品名・ブランド名で検索"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ブランド
              </label>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="">全てのブランド</option>
                {brands.map(brand => (
                  <option key={brand.id} value={brand.id}>{brand.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ステータス
              </label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="activeOnly"
                  checked={showActiveOnly}
                  onChange={(e) => setShowActiveOnly(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="activeOnly" className="ml-2 text-sm text-gray-700">
                  販売中のみ表示
                </label>
              </div>
            </div>

            <div className="flex items-end">
              <div className="text-sm text-gray-600">
                {filteredProducts.length} 件の商品
              </div>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  商品
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ブランド
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  価格
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  在庫
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ステータス
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-16 w-16">
                        <Image
                          src={product.imageUrl || '/default_icon.png'}
                          alt={product.name}
                          width={64}
                          height={64}
                          className="h-16 w-16 rounded-lg object-cover"
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                          {product.name}
                        </div>
                        <div className="text-sm text-gray-500 max-w-xs truncate">
                          {product.description}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.brand.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>本品: ¥{product.price?.toLocaleString() || '0'}</div>
                    <div className="text-gray-500">試供品: ¥{product.samplePrice?.toLocaleString() || '0'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className={product.stock > 0 ? 'text-green-600' : 'text-red-600'}>
                      本品: {product.stock}個
                    </div>
                    <div className={product.sampleStock > 0 ? 'text-green-600' : 'text-red-600'}>
                      試供品: {product.sampleStock}個
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      product.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {product.isActive ? '販売中' : '停止中'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Link
                        href={`/products/${product.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleEdit(product)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(product.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">商品が見つかりません</h3>
              <p className="mt-1 text-sm text-gray-500">
                条件を変更して再度検索してください
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  {editingProduct.id ? '商品編集' : '新規商品追加'}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">商品名</label>
                    <input
                      type="text"
                      value={editingProduct.name}
                      onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">説明</label>
                    <textarea
                      value={editingProduct.description}
                      onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})}
                      rows={3}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">ブランド</label>
                    <select
                      value={editingProduct.brandId}
                      onChange={(e) => setEditingProduct({...editingProduct, brandId: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      <option value="">ブランドを選択</option>
                      {brands.map(brand => (
                        <option key={brand.id} value={brand.id}>{brand.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">本品価格</label>
                      <input
                        type="number"
                        value={editingProduct.price}
                        onChange={(e) => setEditingProduct({...editingProduct, price: parseInt(e.target.value) || 0})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">試供品価格</label>
                      <input
                        type="number"
                        value={editingProduct.samplePrice}
                        onChange={(e) => setEditingProduct({...editingProduct, samplePrice: parseInt(e.target.value) || 0})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">本品在庫</label>
                      <input
                        type="number"
                        value={editingProduct.stock}
                        onChange={(e) => setEditingProduct({...editingProduct, stock: parseInt(e.target.value) || 0})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">試供品在庫</label>
                      <input
                        type="number"
                        value={editingProduct.sampleStock}
                        onChange={(e) => setEditingProduct({...editingProduct, sampleStock: parseInt(e.target.value) || 0})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">画像URL</label>
                    <input
                      type="url"
                      value={editingProduct.imageUrl}
                      onChange={(e) => setEditingProduct({...editingProduct, imageUrl: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={editingProduct.isActive}
                      onChange={(e) => setEditingProduct({...editingProduct, isActive: e.target.checked})}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                      販売中
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={handleSave}
                  disabled={isSubmitting}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : '保存'}
                </button>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      商品を削除
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        この商品を削除してもよろしいですか？この操作は取り消せません。
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  削除
                </button>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}