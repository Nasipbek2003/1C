# Обновление LoadingSpinner

## Что исправлено

### Проблема
При загрузке страниц анимация перекрывала весь экран, включая боковое меню (Sidebar), что выглядело некрасиво.

### Решение
Добавлен параметр `fullScreen` для управления режимом отображения:

- **fullScreen={false}** (по умолчанию) - анимация только в контентной области, Sidebar остается видимым
- **fullScreen={true}** - анимация на весь экран (для страниц без Sidebar, например, страница входа)

## Использование

### Страницы с Sidebar (по умолчанию)

```tsx
if (loading) {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1">
        <LoadingSpinner />  {/* Sidebar остается видимым */}
      </div>
    </div>
  );
}
```

### Полноэкранный режим

```tsx
if (loading) {
  return <LoadingSpinner fullScreen={true} />;  {/* Весь экран */}
}
```

## Технические детали

### Классы контейнера

**Обычный режим (fullScreen={false}):**
```css
flex items-center justify-center min-h-screen bg-gray-100
```
- Центрирование в контентной области
- Минимальная высота = высота экрана
- Фон серый (bg-gray-100)

**Полноэкранный режим (fullScreen={true}):**
```css
fixed inset-0 flex items-center justify-center bg-gray-50 z-50
```
- Фиксированное позиционирование
- Занимает весь экран (inset-0)
- Высокий z-index (50) для перекрытия контента
- Фон светло-серый (bg-gray-50)

## Где используется

### Страницы с Sidebar (fullScreen={false})
- ✅ Главная страница (`/home`)
- ✅ Статистика (`/statistics`)
- ✅ Клиенты (`/customers`)
- ✅ Товары (`/products`)
- ✅ Заказы (`/orders`)
- ✅ Операторы (`/operators`)

### Страницы без Sidebar
- Страница входа (`/login`) - использует свою анимацию в кнопке

## Преимущества

✅ **Sidebar всегда видим** - пользователь видит навигацию даже при загрузке
✅ **Лучший UX** - понятно, что загружается контент, а не вся страница
✅ **Гибкость** - можно использовать оба режима
✅ **Обратная совместимость** - по умолчанию работает как раньше

## Примеры

### Пример 1: Статистика с Sidebar

```tsx
// Sidebar остается видимым, загружается только контент
if (loading) {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1">
        <LoadingSpinner />
      </div>
    </div>
  );
}
```

**Результат:**
```
┌─────────────┬──────────────────────────┐
│             │                          │
│   Sidebar   │      LoadingSpinner      │
│   (видим)   │      (по центру)         │
│             │                          │
└─────────────┴──────────────────────────┘
```

### Пример 2: Полноэкранная загрузка

```tsx
if (loading) {
  return <LoadingSpinner fullScreen={true} />;
}
```

**Результат:**
```
┌──────────────────────────────────────┐
│                                      │
│        LoadingSpinner                │
│        (весь экран)                  │
│                                      │
└──────────────────────────────────────┘
```

## Миграция

Если у вас есть старый код с LoadingSpinner, ничего менять не нужно:

```tsx
// Старый код - работает как раньше
<LoadingSpinner />

// Новый код - то же самое
<LoadingSpinner fullScreen={false} />
```

## Варианты анимаций

Все варианты работают в обоих режимах:

```tsx
<LoadingSpinner variant="circle" />   // По умолчанию
<LoadingSpinner variant="dots" />     // Прыгающие точки
<LoadingSpinner variant="pulse" />    // Пульсация
<LoadingSpinner variant="default" />  // Простое вращение
```

## Размеры

```tsx
<LoadingSpinner size="sm" />   // Маленький
<LoadingSpinner size="md" />   // Средний
<LoadingSpinner size="lg" />   // Большой (по умолчанию)
```

## Кастомный текст

```tsx
<LoadingSpinner text="Загрузка данных..." />
<LoadingSpinner text="Обработка заказа..." />
<LoadingSpinner text="Синхронизация с 1С..." />
```

## Полный пример

```tsx
<LoadingSpinner 
  variant="circle"
  size="lg"
  text="Загрузка статистики..."
  fullScreen={false}
/>
```

## Часто задаваемые вопросы

**Q: Нужно ли обновлять существующий код?**
A: Нет, по умолчанию `fullScreen={false}`, поэтому все работает как раньше.

**Q: Когда использовать fullScreen={true}?**
A: Только для страниц без Sidebar (например, страница входа, страница ошибки).

**Q: Можно ли изменить цвет фона?**
A: Сейчас нет, но можно добавить параметр `bgColor` в будущем.

**Q: Почему Sidebar не исчезает при загрузке?**
A: Это правильное поведение! Sidebar должен оставаться видимым для лучшего UX.
