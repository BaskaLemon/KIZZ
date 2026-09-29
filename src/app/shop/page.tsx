'use client';

import { useEffect, useState } from 'react';
import { Shell, View } from '@/components/Shell';
import { Button, Card, EmptyState, LinkButton } from '@/components/ui';
import { AnimatedCoin } from '@/components/AnimatedCoin';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { api } from '@/lib/api';
import { ApiError, type ShopItem } from '@/lib/types';

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

export default function ShopPage() {
  const { user, ready } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState<ShopItem[] | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([api.listShopItems(), api.getBalance()])
      .then(([itemsRes, balanceRes]) => {
        setItems(itemsRes.items);
        setBalance(balanceRes.balance);
      })
      .catch((err) => toast(errorMessage(err, 'Дэлгүүрийг ачаалж чадсангүй'), 'error'));
  }, [user, toast]);

  async function handlePurchase(item: ShopItem) {
    setPurchasingId(item.id);
    try {
      const result = await api.purchaseItem(item.id);
      setBalance(result.balance);
      setItems((prev) =>
        prev?.map((i) => (i.id === item.id ? { ...i, owned: true } : i)) ?? prev,
      );
      toast(`${item.name} худалдаж авлаа!`);
    } catch (err) {
      toast(errorMessage(err, 'Худалдаж авахад алдаа гарлаа'), 'error');
    } finally {
      setPurchasingId(null);
    }
  }

  if (!ready) return null;

  if (!user) {
    return (
      <Shell activePath="/shop">
        <View narrow>
          <EmptyState title="Эхлээд нэвтэрнэ үү">
            <p>Дэлгүүр ашиглахын тулд бүртгэл хийх шаардлагатай.</p>
            <LinkButton href="/login" variant="primary" className="mt-4">
              Нэвтрэх / Бүртгүүлэх →
            </LinkButton>
          </EmptyState>
        </View>
      </Shell>
    );
  }

  return (
    <Shell activePath="/shop">
      <View>
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-extrabold tracking-tight text-ink">Дэлгүүр</h1>
          <Card className="px-5 py-3 text-center">
            <p className="text-xs font-medium text-ink-soft">Buzz Coin</p>
            <p className="text-2xl font-extrabold text-ink">
              {balance != null ? <AnimatedCoin value={balance} /> : '—'}
            </p>
          </Card>
        </div>

        {!items ? (
          <p className="mt-8 text-ink-soft">Ачааллаж байна...</p>
        ) : items.length === 0 ? (
          <EmptyState title="Дэлгүүр хоосон байна" />
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((item) => {
              const canAfford = (balance ?? 0) >= item.price;
              return (
                <Card key={item.id} className="flex flex-col items-center text-center">
                  <img
                    src={item.value}
                    alt={item.name}
                    className="h-20 w-20 rounded-full bg-paper"
                  />
                  <p className="mt-3 text-sm font-bold text-ink">{item.name}</p>
                  <p className="mt-2 text-lg font-extrabold text-violet">{item.price} оноо</p>
                  <Button
                    variant={item.owned ? 'ghost' : 'primary'}
                    block
                    className="mt-3"
                    disabled={item.owned || purchasingId === item.id || !canAfford}
                    onClick={() => handlePurchase(item)}
                  >
                    {item.owned
                      ? 'Эзэмшсэн'
                      : purchasingId === item.id
                        ? 'Түр хүлээнэ үү...'
                        : canAfford
                          ? 'Худалдаж авах'
                          : 'Оноо хүрэхгүй'}
                  </Button>
                </Card>
              );
            })}
          </div>
        )}
      </View>
    </Shell>
  );
}
