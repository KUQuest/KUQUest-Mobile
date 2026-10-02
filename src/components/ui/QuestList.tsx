import React from "react";
import { type FlatListProps, type ListRenderItem } from "react-native";

import { FlatList } from "@/tw";

export interface QuestListProps<ItemT> extends Omit<
  FlatListProps<ItemT>,
  "data" | "keyExtractor" | "renderItem"
> {
  className?: string;
  contentContainerClassName?: string;
  data: ItemT[];
  keyExtractor: (item: ItemT, index: number) => string;
  renderItem: ListRenderItem<ItemT>;
}

export function QuestList<ItemT>({
  data,
  keyExtractor,
  renderItem,
  ...props
}: QuestListProps<ItemT>) {
  return (
    <FlatList
      {...props}
      data={data}
      keyExtractor={keyExtractor}
      keyboardShouldPersistTaps="handled"
      renderItem={renderItem}
      showsVerticalScrollIndicator={false}
    />
  );
}

QuestList.displayName = "QuestList";
