package com.axelfrache.questify.notification.config;

import com.axelfrache.questify.notification.messaging.QueueConstants;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

  @Bean
  public TopicExchange questifyExchange() {
    return new TopicExchange(QueueConstants.EXCHANGE, true, false);
  }

  @Bean
  public Queue questScheduledQueue() {
    return new Queue(QueueConstants.QUEST_SCHEDULED_QUEUE, true);
  }

  @Bean
  public Queue questCompletedQueue() {
    return new Queue(QueueConstants.QUEST_COMPLETED_QUEUE, true);
  }

  @Bean
  public Queue userDeletedQueue() {
    return new Queue(QueueConstants.USER_DELETED_QUEUE, true);
  }

  @Bean
  public Binding questScheduledBinding(Queue questScheduledQueue, TopicExchange questifyExchange) {
    return BindingBuilder.bind(questScheduledQueue)
        .to(questifyExchange)
        .with(QueueConstants.QUEST_SCHEDULED_ROUTING_KEY);
  }

  @Bean
  public Binding questCompletedBinding(Queue questCompletedQueue, TopicExchange questifyExchange) {
    return BindingBuilder.bind(questCompletedQueue)
        .to(questifyExchange)
        .with(QueueConstants.QUEST_COMPLETED_ROUTING_KEY);
  }

  @Bean
  public Binding userDeletedBinding(Queue userDeletedQueue, TopicExchange questifyExchange) {
    return BindingBuilder.bind(userDeletedQueue)
        .to(questifyExchange)
        .with(QueueConstants.USER_DELETED_ROUTING_KEY);
  }

  @Bean
  public Jackson2JsonMessageConverter messageConverter() {
    return new Jackson2JsonMessageConverter();
  }
}
