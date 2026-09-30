'use client';

import { useEffect, useState } from 'react';
import { LoadingScreen } from '@/components/LoadingScreen';
import { Shell, View } from '@/components/Shell';
import { Button, Card, EmptyState, LinkButton } from '@/components/ui';
import { AnimatedCoin } from '@/components/AnimatedCoin';
import { avatarSrcFor } from '@/lib/avatar';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { api } from '@/lib/api';
import { ApiError, type ShopItem } from '@/lib/types';

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

export default function ShopPage() {
  const { user, ready, updateUser } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState<ShopItem[] | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [wearingId, setWearingId] = useState<string | null>(null);

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
      toast(`${item.name} худалдаж авлаа! Одоо "Өмсөх" дарж хэрэглээрэй.`);
    } catch (err) {
      toast(errorMessage(err, 'Худалдаж авахад алдаа гарлаа'), 'error');
    } finally {
      setPurchasingId(null);
    }
  }

  async function handleWear(item: ShopItem) {
    setWearingId(item.id);
    try {
      await api.equipAvatar(item.id);
      updateUser({ equippedItemId: item.id });
      toast(`${item.name} өмслөө!`);
    } catch (err) {
      toast(errorMessage(err, 'Аватар сольж чадсангүй'), 'error');
    } finally {
      setWearingId(null);
    }
  }

  if (!ready)
    return (
      <Shell activePath="/shop">
        <LoadingScreen />
      </Shell>
    );

  if (!user) {
    return (
      <Shell activePath="/shop">
        <View narrow>
          <EmptyState title="Эхлээд нэвтэрнэ үү">
            <p>Дэлгүүр ашиглахын тулд нэвтрэх шаардлагатай.</p>
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
            <p className="text-xs font-medium text-ink-soft">Kizz Coin</p>
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
                    src={avatarSrcFor({ id: user.id, equippedItemId: item.id })}
                    alt={item.name}
                    className="h-20 w-20 rounded-full bg-paper"
                  />
                  <p className="mt-3 text-sm font-bold text-ink">{item.name}</p>
                  <p className="mt-2 text-lg font-extrabold text-violet">{item.price} оноо</p>
                  {item.owned ? (
                    <Button
                      variant={user.equippedItemId === item.id ? 'ghost' : 'primary'}
                      block
                      className="mt-3"
                      disabled={user.equippedItemId === item.id || wearingId === item.id}
                      onClick={() => handleWear(item)}
                    >
                      {user.equippedItemId === item.id ? 'Өмсөж байна ✓' : 'Өмсөх'}
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      block
                      className="mt-3"
                      disabled={purchasingId === item.id || !canAfford}
                      onClick={() => handlePurchase(item)}
                    >
                      {purchasingId === item.id
                        ? 'Түр хүлээнэ үү...'
                        : canAfford
                          ? 'Худалдаж авах'
                          : 'Оноо хүрэхгүй'}
                    </Button>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </View>
    </Shell>
  );
}
