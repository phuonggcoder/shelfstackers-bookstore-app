import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Dimensions, FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import BookGrid2Col from '../components/BookGrid2Col';
import BookGrid3Col from '../components/BookGrid3Col';
import BookGrid4Col from '../components/BookGrid4Col';
import api from '../services/api';
import { Book, Category } from '../types';

const { width } = Dimensions.get('window');
const SORT_OPTIONS = [
  { label: 'Mới nhất', value: 'newest' },
  { label: 'Giá tăng dần', value: 'price_asc' },
  { label: 'Giá giảm dần', value: 'price_desc' },
  { label: 'A-Z', value: 'az' },
  { label: 'Z-A', value: 'za' },
  { label: 'Bán chạy tuần', value: 'week' },
  { label: 'Bán chạy tháng', value: 'month' },
  { label: 'Bán chạy năm', value: 'year' },
  { label: 'Nổi bật', value: 'featured' },
];
const ITEM_PER_ROW_OPTIONS = [2, 3, 4];
const PAGE_SIZE_OPTIONS = [12, 24, 48];
const MAX_PRICE = 1000000;

const PRICE_PRESETS = [
  { label: '0đ - 150,000đ', min: 0, max: 150000 },
  { label: '150,000đ - 300,000đ', min: 150000, max: 300000 },
  { label: '300,000đ - 500,000đ', min: 300000, max: 500000 },
  { label: '500,000đ - 700,000đ', min: 500000, max: 700000 },
  { label: '700,000đ trở lên', min: 700000, max: MAX_PRICE },
];

type BookWithSupplier = Book & { supplier?: string };

const FilteredBooksScreen = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams();
  const [books, setBooks] = useState<BookWithSupplier[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [supplierList, setSupplierList] = useState<string[]>([]);
  const [showAllSuppliers, setShowAllSuppliers] = useState(false);
  const [selectedPricePreset, setSelectedPricePreset] = useState<number|null>(null);
  // Lấy tất cả ngôn ngữ có trong books
  const languages = Array.from(new Set(books.map((b: Book) => b.language).filter(Boolean)));

  // State filter nâng cao
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [price, setPrice] = useState(MAX_PRICE);
  const [sort, setSort] = useState<string>('newest');
  const [itemPerRow, setItemPerRow] = useState(2);
  const [pageSize, setPageSize] = useState(24);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showFilterSidebar, setShowFilterSidebar] = useState(false);
  // 1. Thêm state cho giá từ - đến và nhà cung cấp
  const [minPrice, setMinPrice] = useState(0);
  const [maxPriceInput, setMaxPriceInput] = useState(MAX_PRICE);
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const SUPPLIERS = ['NXB Kim Đồng', 'NXB Trẻ', 'NXB Giáo Dục', 'NXB Văn Học', 'NXB Tổng Hợp', 'NXB Lao Động']; // hoặc lấy từ API nếu có
  const [searchText, setSearchText] = useState('');
  const [showModalInputPage, setShowModalInputPage] = useState<'left'|'right'|null>(null);
  const [inputPage, setInputPage] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const inputPageRef = useRef<TextInput>(null);
  const [promotionCampaigns, setPromotionCampaigns] = useState<any[]>([]);
  const [eventCampaigns, setEventCampaigns] = useState<any[]>([]);

  // Fetch books & categories from API
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [booksData, categoriesData, campaignsData] = await Promise.all([
          api.getBooks(),
          api.getCategories(),
          api.getCampaigns()
        ]);
        setBooks(booksData as BookWithSupplier[]);
        setCategories(categoriesData as Category[]);
        // Lấy danh sách supplier duy nhất từ books
        const allSuppliers = Array.from(new Set((booksData as BookWithSupplier[]).map((b) => b.supplier).filter((s): s is string => Boolean(s))));
        setSupplierList(allSuppliers);
        // Tách campaign type 'promotion' và 'event'
        setPromotionCampaigns((campaignsData || []).filter((c: any) => c.type === 'promotion'));
        setEventCampaigns((campaignsData || []).filter((c: any) => c.type === 'event'));
      } catch (e) {
        setBooks([]); setCategories([]); setSupplierList([]); setPromotionCampaigns([]); setEventCampaigns([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (params.searchText) setSearchText(params.searchText as string);
  }, [params.searchText]);

  // Khi nhận categoryId từ params, tự động setSelectedCategories
  useEffect(() => {
    if (params.categoryId) {
      setSelectedCategories([params.categoryId as string]);
      setSelectedCategoryName(params.categoryName as string | undefined);
    }
  }, [params.categoryId, params.categoryName]);

  // Khi user chọn lại danh mục trong filter bar, cập nhật lại tên danh mục
  useEffect(() => {
    if (selectedCategories.length === 1 && categories.length > 0) {
      const cat = categories.find(c => c._id === selectedCategories[0]);
      if (cat) setSelectedCategoryName(cat.name);
    } else if (selectedCategories.length === 0) {
      setSelectedCategoryName(undefined);
    }
  }, [selectedCategories, categories]);

  // Lọc và sắp xếp toàn bộ sách
  const filteredBooks = useMemo(() => {
    let result = books;
    if (selectedCategories.length > 0) {
      result = result.filter(book => {
        if (!book.categories) return false;
        // book.categories có thể là mảng string hoặc object
        return book.categories.some((cat: any) => {
          if (typeof cat === 'string') return selectedCategories.includes(cat);
          if (cat && typeof cat === 'object' && cat._id) return selectedCategories.includes(cat._id);
          return false;
        });
      });
    }
    if (selectedLanguages.length > 0) {
      result = result.filter(book => selectedLanguages.includes(book.language));
    }
    // Lọc theo supplier
    if (selectedSuppliers.length > 0) {
      result = result.filter(book => selectedSuppliers.includes((book as BookWithSupplier).supplier || ''));
    }
    // Lọc theo giá preset nếu có
    if (selectedPricePreset !== null) {
      const preset = PRICE_PRESETS[selectedPricePreset];
      result = result.filter(book => book.price >= preset.min && (preset.max === MAX_PRICE ? true : book.price < preset.max));
    } else {
      // Lọc theo slider/tùy chỉnh
      if (minPrice > 0) result = result.filter(book => book.price >= minPrice);
      if (maxPriceInput < MAX_PRICE) result = result.filter(book => book.price <= maxPriceInput);
      if (price < MAX_PRICE) result = result.filter(book => book.price <= price);
    }
    switch (sort) {
      case 'price_asc':
        result = [...result].sort((a, b) => a.price - b.price); break;
      case 'price_desc':
        result = [...result].sort((a, b) => b.price - a.price); break;
      case 'az':
        result = [...result].sort((a, b) => a.title.localeCompare(b.title)); break;
      case 'za':
        result = [...result].sort((a, b) => b.title.localeCompare(a.title)); break;
      case 'newest':
        result = [...result].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break;
      default: break;
    }
    return result;
  }, [books, selectedCategories, selectedLanguages, price, sort, minPrice, maxPriceInput, selectedSuppliers, selectedPricePreset]);

  // Lọc realtime theo searchText
  const searchedBooks = useMemo(() => {
    if (!searchText.trim()) return filteredBooks;
    const q = searchText.toLowerCase();
    return filteredBooks.filter(book =>
      book.title.toLowerCase().includes(q) ||
      (book.author && book.author.toLowerCase().includes(q))
    );
  }, [filteredBooks, searchText]);
  const pagedBooks = searchedBooks.slice((page - 1) * pageSize, page * pageSize);

  const totalPages = Math.ceil(filteredBooks.length / pageSize);
  const ITEM_WIDTH = (width - 32 - (itemPerRow - 1) * 12) / itemPerRow;

  // Reset page về 1 khi đổi filter
  React.useEffect(() => {
    setPage(1);
  }, [selectedCategories, selectedLanguages, price, sort, pageSize]);

  // Xử lý các sort chưa có API
  React.useEffect(() => {
    if (["week", "month", "year", "featured"].includes(sort)) {
      console.log(t('featureNotSupported'), sort);
    }
  }, [sort, t]);

  // Xóa bộ lọc
  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedLanguages([]);
    setPrice(MAX_PRICE);
    setSort('newest');
    setItemPerRow(2);
    setPageSize(24);
    setMinPrice(0);
    setMaxPriceInput(MAX_PRICE);
    setSelectedSuppliers([]);
    setSelectedPricePreset(null);
  };

  // Hàm kiểm tra có filter nào đang được áp dụng không
  const hasActiveFilter = () => {
    return (
      selectedCategories.length > 0 ||
      selectedLanguages.length > 0 ||
      selectedSuppliers.length > 0 ||
      minPrice > 0 ||
      maxPriceInput < MAX_PRICE ||
      price < MAX_PRICE ||
      selectedPricePreset !== null
    );
  };

  // Thanh filter ngang mới
  const renderFilterBar = () => (
    <View style={{flexDirection:'row',alignItems:'center',paddingHorizontal:12,paddingVertical:8,backgroundColor:'#fff',borderBottomWidth:1,borderColor:'#eee',gap:8}}>
      {/* Danh mục */}
      <View style={{width: 120}}>
        <TouchableOpacity style={{flexDirection:'row',alignItems:'center',backgroundColor:'#fff',borderRadius:8,borderWidth:1,borderColor:'#1976D2',paddingHorizontal:8,paddingVertical:8, minWidth: 0}} onPress={()=>setShowCategoryDropdown(!showCategoryDropdown)}>
          <Ionicons name="list" size={18} color="#1976D2" style={{marginRight:6}} />
          <Text style={{color:'#1976D2',fontWeight:'bold',fontSize:13}}>{t('categories')}</Text>
          <Ionicons name={showCategoryDropdown ? 'chevron-up' : 'chevron-down'} size={16} color="#1976D2" style={{marginLeft:4}} />
        </TouchableOpacity>
        {showCategoryDropdown && (
          <View style={{position:'absolute',top:44,left:0,right:0,zIndex:10,backgroundColor:'#fff',borderRadius:8,shadowColor:'#000',shadowOpacity:0.08,shadowRadius:8,elevation:2,borderWidth:1,borderColor:'#eee'}}>
            <ScrollView style={{maxHeight:220}}>
              {categories.map(cat => (
                <Pressable key={cat._id} style={{padding:12,borderBottomWidth:1,borderColor:'#f2f2f2'}} onPress={()=>{
                  setSelectedCategories([cat._id]);
                  setShowCategoryDropdown(false);
                }}>
                  <Text style={{color:selectedCategories.includes(cat._id)?'#1976D2':'#222',fontWeight:selectedCategories.includes(cat._id)?'bold':'normal'}}>{cat.name}</Text>
                </Pressable>
              ))}
              <Pressable style={{padding:12}} onPress={()=>{setSelectedCategories([]);setShowCategoryDropdown(false);}}>
                <Text style={{color:'#888'}}>{t('allCategories')}</Text>
              </Pressable>
            </ScrollView>
          </View>
        )}
      </View>
      {/* Sắp xếp */}
      <View style={{width: 120}}>
        <TouchableOpacity style={{flexDirection:'row',alignItems:'center',backgroundColor:'#fff',borderRadius:8,borderWidth:1,borderColor:'#1976D2',paddingHorizontal:8,paddingVertical:8, minWidth: 0}} onPress={()=>setShowSortDropdown(!showSortDropdown)}>
          <Ionicons name="swap-vertical" size={18} color="#1976D2" style={{marginRight:6}} />
          <Text style={{color:'#1976D2',fontWeight:'bold',fontSize:13}}>{t('sort')}</Text>
          <Ionicons name={showSortDropdown ? 'chevron-up' : 'chevron-down'} size={16} color="#1976D2" style={{marginLeft:4}} />
        </TouchableOpacity>
        {showSortDropdown && (
          <View style={{position:'absolute',top:44,left:0,right:0,zIndex:10,backgroundColor:'#fff',borderRadius:8,shadowColor:'#000',shadowOpacity:0.08,shadowRadius:8,elevation:2,borderWidth:1,borderColor:'#eee'}}>
            <ScrollView style={{maxHeight:220}}>
              {SORT_OPTIONS.map(opt => (
                <Pressable key={opt.value} style={{padding:12,borderBottomWidth:1,borderColor:'#f2f2f2'}} onPress={()=>{
                  setSort(opt.value);
                  setShowSortDropdown(false);
                }}>
                  <Text style={{color:sort===opt.value?'#1976D2':'#222',fontWeight:sort===opt.value?'bold':'normal'}}>{opt.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
      {/* Lọc nâng cao + X */}
      <View style={{flexDirection:'row',alignItems:'center'}}>
        <TouchableOpacity style={{flexDirection:'row',alignItems:'center',backgroundColor:'#1976D2',borderRadius:8,paddingHorizontal:16,paddingVertical:8, minWidth: 0}} onPress={()=>setShowFilterSidebar(true)}>
          <Ionicons name="filter" size={18} color="#fff" style={{marginRight:6}} />
          <Text style={{color:'#fff',fontWeight:'bold',fontSize:13}}>{t('filter')}</Text>
        </TouchableOpacity>
        {hasActiveFilter() && (
          <TouchableOpacity onPress={clearFilters} style={{marginLeft:4, padding:4}}>
            <Ionicons name="close-circle" size={22} color="#FF5252" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  // Sidebar filter nâng cao (Modal trượt từ phải sang)
  const renderFilterSidebar = () => (
    <Modal visible={showFilterSidebar} animationType="slide" transparent onRequestClose={()=>setShowFilterSidebar(false)}>
      <View style={{flex:1,backgroundColor:'rgba(0,0,0,0.18)',flexDirection:'row',justifyContent:'flex-end'}}>
        <View style={{width:'80%',backgroundColor:'#fff',height:'100%',padding:18,shadowColor:'#000',shadowOpacity:0.12,shadowRadius:12,elevation:4}}>
          <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <Text style={{fontSize:18,fontWeight:'bold',color:'#1976D2'}}>{t('filters')}</Text>
            <TouchableOpacity onPress={()=>setShowFilterSidebar(false)}>
              <Ionicons name="close" size={26} color="#1976D2" />
            </TouchableOpacity>
          </View>
          <ScrollView>
      {/* Giá */}
            <Text style={{fontWeight:'bold',marginTop:12,marginBottom:4, color:'#1976D2'}}>{t('price')}</Text>
        <Slider
              style={{ width: '100%', height: 30 }}
          minimumValue={0}
          maximumValue={MAX_PRICE}
          step={10000}
          value={price}
          onValueChange={setPrice}
              minimumTrackTintColor="#1976D2"
          maximumTrackTintColor="#ddd"
              thumbTintColor="#1976D2"
            />
            <Text style={{marginBottom:8, color:'#1976D2'}}>≤ <Text style={{fontWeight:'bold',color:'#1976D2'}}>{price === MAX_PRICE ? '∞' : price.toLocaleString() + 'đ'}</Text></Text>
            {/* Giá theo khoảng (preset) */}
            <View style={{flexDirection:'row',flexWrap:'wrap',gap:8,marginBottom:8}}>
              {PRICE_PRESETS.map((preset, idx) => (
                <TouchableOpacity key={preset.label} style={{backgroundColor:selectedPricePreset===idx?'#1976D2':'#fff',borderColor:'#1976D2',borderWidth:1,borderRadius:8,paddingHorizontal:12,paddingVertical:10,minWidth:120,alignItems:'center'}} onPress={()=>setSelectedPricePreset(selectedPricePreset===idx?null:idx)}>
                  <Text style={{color:selectedPricePreset===idx?'#fff':'#1976D2',fontWeight:'bold'}}>{preset.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {/* Giá theo khoảng tùy chỉnh */}
            <View style={{flexDirection:'row',alignItems:'center',gap:8,marginBottom:8}}>
              <Text style={{color:'#1976D2'}}>{t('from')}</Text>
              <TextInput
                style={{borderWidth:1,borderColor:'#1976D2',borderRadius:6,padding:4,minWidth:60,textAlign:'center',color:'#1976D2'}}
                keyboardType="numeric"
                value={minPrice.toString()}
                onChangeText={v=>setMinPrice(Number(v.replace(/\D/g, '')))}
                placeholder="0"
              />
              <Text style={{color:'#1976D2'}}>{t('to')}</Text>
              <TextInput
                style={{borderWidth:1,borderColor:'#1976D2',borderRadius:6,padding:4,minWidth:60,textAlign:'center',color:'#1976D2'}}
                keyboardType="numeric"
                value={maxPriceInput.toString()}
                onChangeText={v=>setMaxPriceInput(Number(v.replace(/\D/g, '')))}
                placeholder={MAX_PRICE.toString()}
              />
              <Text style={{color:'#1976D2'}}>đ</Text>
      </View>
            {/* Ngôn ngữ */}
            <Text style={{fontWeight:'bold',marginTop:12,marginBottom:4}}>{t('language')}</Text>
            <View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>
              {languages.map(lang => (
                <TouchableOpacity key={lang} style={{backgroundColor:selectedLanguages.includes(lang)?'#1976D2':'#fff',borderColor:'#1976D2',borderWidth:1,borderRadius:16,paddingHorizontal:12,paddingVertical:6,marginBottom:6}} onPress={()=>setSelectedLanguages(selectedLanguages.includes(lang)?selectedLanguages.filter(l=>l!==lang):[...selectedLanguages,lang])}>
                  <Text style={{color:selectedLanguages.includes(lang)?'#fff':'#1976D2',fontWeight:'bold'}}>{lang}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {/* Số item/hàng */}
            <Text style={{fontWeight:'bold',marginTop:12,marginBottom:4}}>{t('itemsPerRow')}</Text>
            <View style={{flexDirection:'row',gap:8,marginBottom:8}}>
        {ITEM_PER_ROW_OPTIONS.map(opt => (
                <TouchableOpacity key={opt} style={{backgroundColor:itemPerRow===opt?'#1976D2':'#fff',borderColor:'#1976D2',borderWidth:1,borderRadius:8,paddingHorizontal:12,paddingVertical:6}} onPress={()=>setItemPerRow(opt)}>
                  <Text style={{color:itemPerRow===opt?'#fff':'#1976D2',fontWeight:'bold'}}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {/* Số item/trang */}
            <Text style={{fontWeight:'bold',marginTop:12,marginBottom:4}}>{t('itemsPerPage')}</Text>
            <View style={{flexDirection:'row',gap:8,marginBottom:8}}>
        {PAGE_SIZE_OPTIONS.map(opt => (
                <TouchableOpacity key={opt} style={{backgroundColor:pageSize===opt?'#1976D2':'#fff',borderColor:'#1976D2',borderWidth:1,borderRadius:8,paddingHorizontal:12,paddingVertical:6}} onPress={()=>setPageSize(opt)}>
                  <Text style={{color:pageSize===opt?'#fff':'#1976D2',fontWeight:'bold'}}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>
            {/* Nhà cung cấp động + Xem thêm */}
            <Text style={{fontWeight:'bold',marginTop:12,marginBottom:4, color:'#1976D2'}}>{t('supplier')}</Text>
            <View style={{flexDirection:'row',flexWrap:'wrap',gap:8,marginBottom:8}}>
              {(showAllSuppliers?supplierList:supplierList.slice(0,6)).map(sup => (
                <TouchableOpacity key={sup} style={{backgroundColor:selectedSuppliers.includes(sup)?'#1976D2':'#fff',borderColor:'#1976D2',borderWidth:1,borderRadius:16,paddingHorizontal:12,paddingVertical:6,marginBottom:6}} onPress={()=>setSelectedSuppliers(selectedSuppliers.includes(sup)?selectedSuppliers.filter(l=>l!==sup):[...selectedSuppliers,sup])}>
                  <Text style={{color:selectedSuppliers.includes(sup)?'#fff':'#1976D2',fontWeight:'bold'}}>{sup}</Text>
                </TouchableOpacity>
              ))}
              {supplierList.length>6 && !showAllSuppliers && (
                <TouchableOpacity onPress={()=>setShowAllSuppliers(true)} style={{alignSelf:'center',marginTop:6}}>
                  <Text style={{color:'#1976D2',fontWeight:'bold',textDecorationLine:'underline'}}>{t('showMore')} ▼</Text>
                </TouchableOpacity>
              )}
              {supplierList.length>6 && showAllSuppliers && (
                <TouchableOpacity onPress={()=>setShowAllSuppliers(false)} style={{alignSelf:'center',marginTop:6}}>
                  <Text style={{color:'#1976D2',fontWeight:'bold',textDecorationLine:'underline'}}>{t('showLess')} ▲</Text>
                </TouchableOpacity>
              )}
            </View>
    </ScrollView>
          <View style={{flexDirection:'row',justifyContent:'space-between',marginTop:18}}>
            <TouchableOpacity style={{backgroundColor:'#fff',borderColor:'#1976D2',borderWidth:1,borderRadius:8,paddingHorizontal:18,paddingVertical:10}} onPress={clearFilters}>
              <Text style={{color:'#1976D2',fontWeight:'bold'}}>{t('clearFilters')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{backgroundColor:'#1976D2',borderRadius:8,paddingHorizontal:18,paddingVertical:10}} onPress={()=>setShowFilterSidebar(false)}>
              <Text style={{color:'#fff',fontWeight:'bold'}}>{t('close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Pressable style={{flex:1}} onPress={()=>setShowFilterSidebar(false)} />
      </View>
    </Modal>
  );

  // Thêm hàm renderPaginationNumbers để hiển thị phân trang dạng số
  const renderPaginationNumbers = () => {
    if (totalPages <= 1) return null;
    const pages = [];
    const showInput = (side: 'left'|'right') => setShowModalInputPage(side);
    const handleInputPage = () => {
      const n = Number(inputPage);
      if (n >= 1 && n <= totalPages) {
        setPage(n);
        setShowModalInputPage(null);
        setInputPage('');
        setTimeout(scrollToTop, 200);
      }
    };
    // Trang đầu
    pages.push(
      <TouchableOpacity key={1} onPress={() => { setPage(1); setTimeout(scrollToTop, 200); }} style={page === 1 ? styles.pageNumActive : styles.pageNumBtn}>
        <Text style={page === 1 ? styles.pageNumActiveText : styles.pageNumText}>1</Text>
      </TouchableOpacity>
    );
    // ... trái
    if (page > 4) {
      pages.push(
        showModalInputPage === 'left' ? (
          <Modal
            key="input-modal-left"
            visible={showModalInputPage === 'left'}
            transparent
            onRequestClose={() => setShowModalInputPage(null)}
          >
            <TouchableOpacity activeOpacity={1} onPress={() => setShowModalInputPage(null)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', alignItems: 'center', justifyContent: 'center' }}>
              <TouchableOpacity activeOpacity={1} style={{ width: '80%', backgroundColor: '#fff', borderRadius: 16, padding: 28, alignItems: 'center', elevation: 6 }} onPress={e => e.stopPropagation()}>
                <Text style={{fontSize:18, fontWeight:'bold', color:'#1976D2', marginBottom:16}}>{t('enterPageNumber')}</Text>
                <TextInput
                  ref={inputPageRef}
                  style={{ borderWidth: 1, borderColor: '#1976D2', borderRadius: 12, padding: 16, minWidth: 120, textAlign: 'center', color: '#1976D2', fontSize: 28, fontWeight: 'bold', marginBottom: 8 }}
                  keyboardType="numeric"
                  value={inputPage}
                  onChangeText={v => setInputPage(v.replace(/[^0-9]/g, '').slice(0, 1))}
                  onSubmitEditing={handleInputPage}
                  autoFocus
                  placeholder="..."
                  returnKeyType="done"
                />
                <TouchableOpacity onPress={() => setShowModalInputPage(null)} style={{ position: 'absolute', top: 12, right: 12 }}>
                  <Ionicons name="close" size={28} color="#1976D2" />
                </TouchableOpacity>
              </TouchableOpacity>
            </TouchableOpacity>
          </Modal>
        ) : (
          <TouchableOpacity key="left-ellipsis" onPress={() => showInput('left')}>
            <Text style={styles.pageEllipsis}>...</Text>
          </TouchableOpacity>
        )
      );
    }
    // Các trang ở giữa
    let start = Math.max(2, page - 2);
    let end = Math.min(totalPages - 1, page + 2);
    if (page <= 4) {
      start = 2;
      end = Math.min(totalPages - 1, 5);
    }
    if (page >= totalPages - 3) {
      start = Math.max(2, totalPages - 4);
      end = totalPages - 1;
    }
    for (let i = start; i <= end; i++) {
      pages.push(
        <TouchableOpacity key={i} onPress={() => { setPage(i); setTimeout(scrollToTop, 200); }} style={page === i ? styles.pageNumActive : styles.pageNumBtn}>
          <Text style={page === i ? styles.pageNumActiveText : styles.pageNumText}>{i}</Text>
        </TouchableOpacity>
      );
    }
    // ... phải
    if (page < totalPages - 3) {
      pages.push(
        showModalInputPage === 'right' ? (
          <Modal
            key="input-modal-right"
            visible={showModalInputPage === 'right'}
            transparent
            onRequestClose={() => setShowModalInputPage(null)}
          >
            <TouchableOpacity activeOpacity={1} onPress={() => setShowModalInputPage(null)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', alignItems: 'center', justifyContent: 'center' }}>
              <TouchableOpacity activeOpacity={1} style={{ width: '80%', backgroundColor: '#fff', borderRadius: 16, padding: 28, alignItems: 'center', elevation: 6 }} onPress={e => e.stopPropagation()}>
                <Text style={{fontSize:18, fontWeight:'bold', color:'#1976D2', marginBottom:16}}>{t('enterPageNumber')}</Text>
                <TextInput
                  ref={inputPageRef}
                  style={{ borderWidth: 1, borderColor: '#1976D2', borderRadius: 12, padding: 16, minWidth: 120, textAlign: 'center', color: '#1976D2', fontSize: 28, fontWeight: 'bold', marginBottom: 8 }}
                  keyboardType="numeric"
                  value={inputPage}
                  onChangeText={v => setInputPage(v.replace(/[^0-9]/g, '').slice(0, 1))}
                  onSubmitEditing={handleInputPage}
                  autoFocus
                  placeholder="..."
                  returnKeyType="done"
                />
                <TouchableOpacity onPress={() => setShowModalInputPage(null)} style={{ position: 'absolute', top: 12, right: 12 }}>
                  <Ionicons name="close" size={28} color="#1976D2" />
                </TouchableOpacity>
              </TouchableOpacity>
            </TouchableOpacity>
          </Modal>
        ) : (
          <TouchableOpacity key="right-ellipsis" onPress={() => showInput('right')}>
            <Text style={styles.pageEllipsis}>...</Text>
          </TouchableOpacity>
        )
      );
    }
    // Trang cuối
    pages.push(
      <TouchableOpacity key={totalPages} onPress={() => { setPage(totalPages); setTimeout(scrollToTop, 200); }} style={page === totalPages ? styles.pageNumActive : styles.pageNumBtn}>
        <Text style={page === totalPages ? styles.pageNumActiveText : styles.pageNumText}>{totalPages}</Text>
      </TouchableOpacity>
    );
    return pages;
  };

  // Hàm scroll lên đầu
  const scrollToTop = () => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  // useEffect để focus input khi showModalInputPage thay đổi
  useEffect(() => {
    if (showModalInputPage) {
      const timer = setTimeout(() => {
        inputPageRef.current?.focus();
      }, 500); // delay 500ms
      return () => clearTimeout(timer);
    }
  }, [showModalInputPage]);

  // Khi searchText thay đổi, luôn setPage(1)
  useEffect(() => {
    setPage(1);
  }, [searchText]);

  const insets = useSafeAreaInsets();
  const [selectedCategoryName, setSelectedCategoryName] = useState<string | undefined>(params.categoryName as string | undefined);

  // Handler hủy chọn danh mục
  const handleClearCategory = () => {
    setSelectedCategories([]);
    setSelectedCategoryName(undefined);
  };

  // Thêm log kiểm tra eventCampaigns
  console.log('eventCampaigns:', eventCampaigns);
  try {
    console.log('eventCampaigns JSON:', JSON.stringify(eventCampaigns));
  } catch (e) {}

  // Hàm chuyển sang trang chi tiết sách
  const handleBookPress = (book: Book) => {
    router.push({ pathname: '/book/[id]', params: { id: book._id } });
  };
  return (
    <SafeAreaView style={[styles.container, { paddingTop: 0, paddingBottom: 0 }]}> 
      {/* Header: nút back + thanh tìm kiếm */}
      <View style={[styles.headerRow,{backgroundColor:'#fff',borderBottomWidth:1,borderColor:'#eee',paddingBottom:6, paddingTop: insets.top - 20, flexDirection:'row', alignItems:'center'}]}> 
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#1976D2" style={{marginRight:4}} />
        </TouchableOpacity>
        <View style={{flex:1, marginLeft: 4, justifyContent:'center'}}>
          <View style={{flexDirection:'row', alignItems:'center', backgroundColor:'#f2f2f2', borderRadius:18, paddingHorizontal:18, height:56}}>
            <Ionicons name="search" size={28} color="#888" style={{marginRight:10}} />
            <TextInput
              style={{flex:1, color:'#222', fontSize:20, height:56, paddingVertical:0, backgroundColor:'transparent'}}
              placeholder={t('searchBooks')}
              placeholderTextColor="#888"
              value={searchText}
              onChangeText={setSearchText}
              returnKeyType="search"
            />
          </View>
        </View>
      </View>
      {/* Hiển thị tên danh mục đã chọn hoặc kết quả tìm kiếm */}
      {searchText.trim() ? (
        <Text style={{fontSize:20, fontWeight:'bold', color:'#1976D2', textAlign:'center', marginTop:12, marginBottom:4}}>
          {t('searchResultsFor', { query: searchText.trim() })}
        </Text>
      ) : selectedCategoryName ? (
        <View style={{flexDirection:'row', alignItems:'center', justifyContent:'center', marginTop:12, marginBottom:4}}>
          <Text style={{fontSize:22, fontWeight:'bold', color:'#1976D2', textAlign:'center'}}>{selectedCategoryName}</Text>
          <TouchableOpacity onPress={handleClearCategory} style={{marginLeft:8, padding:4}}>
            <Ionicons name="close-circle" size={26} color="#1976D2" />
          </TouchableOpacity>
        </View>
      ) : null}
      {renderFilterBar()}
      {renderFilterSidebar()}
      {/* Loading indicator */}
      {loading && (
        <View style={{alignItems:'center', marginTop:32}}>
          <ActivityIndicator size="large" color="#1976D2" />
          <Text style={{color:'#1976D2', marginTop:8}}>{t('loadingData')}</Text>
        </View>
      )}
      {/* Danh sách sách dạng lưới */}
      {!loading && (
      <FlatList
          ref={flatListRef}
        data={pagedBooks}
        keyExtractor={item => item._id}
        numColumns={itemPerRow}
          key={`flatlist-${itemPerRow}`}
          contentContainerStyle={{ ...styles.listContent, paddingBottom: 24 + insets.bottom + 50 }}
          columnWrapperStyle={{ justifyContent: 'center', marginHorizontal: 4 }}
          renderItem={({ item }) => {
            let Comp: React.ComponentType<{ book: Book; onPress?: (book: Book) => void }> = BookGrid2Col;
            let fixedHeight = 300;
            if (itemPerRow === 3) { Comp = BookGrid3Col; fixedHeight = 210; }
            else if (itemPerRow === 4) { Comp = BookGrid4Col; fixedHeight = 170; }
            // Tăng chiều cao col2 nhiều hơn
            if (itemPerRow === 2) fixedHeight = 320;
            return (
              <View style={{ width: ITEM_WIDTH, marginBottom: 18, marginHorizontal: 4, height: fixedHeight }}>
                <Comp book={item} onPress={handleBookPress} />
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={{alignItems:'center', marginTop:48}}>
              <Ionicons name="book-outline" size={64} color="#bdc3c7" style={{marginBottom:8}} />
              <Text style={{fontSize:16, color:'#888', fontWeight:'500'}}>{t('noBooksFound')}</Text>
              <Text style={{fontSize:13, color:'#aaa', marginTop:4}}>{t('tryChangingFilters')}</Text>
          </View>
          }
        />
      )}
      {/* Nút mũi tên lên nhỏ */}
      <TouchableOpacity
        onPress={scrollToTop}
        style={{position:'absolute', right:18, bottom:insets.bottom+70, backgroundColor:'#1976D2', borderRadius:20, width:36, height:36, alignItems:'center', justifyContent:'center', elevation:3, shadowColor:'#000', shadowOpacity:0.08, shadowRadius:4}}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-up" size={22} color="#fff" />
      </TouchableOpacity>
      {/* Phân trang mới dạng số */}
      <View style={[styles.paginationRowNumbers, { paddingBottom: insets.bottom -20 }]}> 
        <TouchableOpacity disabled={page === 1} onPress={() => { setPage(page-1); setTimeout(scrollToTop, 200); }}>
          <Ionicons name="chevron-back" size={22} color={page === 1 ? '#ccc' : '#FF9800'} />
        </TouchableOpacity>
        {renderPaginationNumbers()}
        <TouchableOpacity disabled={page === totalPages || totalPages === 0} onPress={() => { setPage(page+1); setTimeout(scrollToTop, 200); }}>
          <Ionicons name="chevron-forward" size={22} color={(page === totalPages || totalPages === 0) ? '#ccc' : '#FF9800'} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  backBtn: {
    marginRight: 12,
    padding: 4,
  },
  backText: {
    color: '#1976D2',
    fontWeight: 'bold',
    fontSize: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
  },
  advancedFilterPlaceholder: {
    padding: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#eee',
    marginBottom: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  row: {
    justifyContent: 'space-between',
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    marginTop: 32,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: '#eee',
    gap: 8,
  },
  pageBtn: {
    fontSize: 18,
    color: '#1976D2',
    paddingHorizontal: 8,
    fontWeight: 'bold',
  },
  pageBtnDisabled: {
    color: '#ccc',
  },
  pageNum: {
    fontSize: 16,
    color: '#333',
    marginHorizontal: 8,
  },
  advancedFilterBar: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingBottom: 8,
    marginBottom: 8,
    backgroundColor: '#f8f8ff',
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 4,
  },
  chipSelected: {
    backgroundColor: '#5E5CE6',
    borderColor: '#5E5CE6',
  },
  chipText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#fff',
  },
  chipRemove: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 4,
    fontSize: 16,
  },
  sliderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  sliderLabel: {
    fontSize: 13,
    color: '#444',
    marginBottom: 2,
  },
  sortSelectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  sortBtn: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    backgroundColor: '#fff',
  },
  sortBtnActive: {
    backgroundColor: '#5E5CE6',
    borderColor: '#5E5CE6',
  },
  sortBtnText: {
    color: '#333',
    fontSize: 13,
  },
  sortBtnTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  itemPerRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  itemPerRowBtn: {
    fontSize: 14,
    color: '#1976D2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#1976D2',
    marginHorizontal: 2,
  },
  itemPerRowBtnActive: {
    backgroundColor: '#1976D2',
    color: '#fff',
  },
  pageSizeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  pageSizeBtn: {
    fontSize: 14,
    color: '#1976D2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#1976D2',
    marginHorizontal: 2,
  },
  pageSizeBtnActive: {
    backgroundColor: '#1976D2',
    color: '#fff',
  },
  paginationRowNumbers: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#fff',
    gap: 4,
  },
  pageNumBtn: {
    minWidth: 32,
    height: 32,
    borderRadius: 4,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
    borderWidth: 1,
    borderColor: '#eee',
  },
  pageNumText: {
    color: '#222',
    fontSize: 16,
    fontWeight: '500',
  },
  pageNumActive: {
    minWidth: 32,
    height: 32,
    borderRadius: 4,
    backgroundColor: '#1976D2', // đỏ
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
  },
  pageNumActiveText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  pageEllipsis: {
    color: '#888',
    fontSize: 18,
    marginHorizontal: 2,
    fontWeight: 'bold',
  },
});

export default FilteredBooksScreen; 