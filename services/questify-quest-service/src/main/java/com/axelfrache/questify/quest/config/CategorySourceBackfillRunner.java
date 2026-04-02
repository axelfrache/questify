package com.axelfrache.questify.quest.config;

import com.axelfrache.questify.quest.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CategorySourceBackfillRunner implements ApplicationRunner {

  private final CategoryService categoryService;

  @Override
  public void run(ApplicationArguments args) {
    categoryService.backfillCategorySources();
  }
}
