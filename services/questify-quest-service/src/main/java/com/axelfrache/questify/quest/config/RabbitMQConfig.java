package com.axelfrache.questify.quest.config;

import com.axelfrache.questify.quest.messaging.QueueConstants;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.JacksonJsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@Slf4j
public class RabbitMQConfig {

  @Bean
  public TopicExchange questifyExchange() {
    return new TopicExchange(QueueConstants.EXCHANGE, true, false);
  }

  @Bean
  public Queue userRegisteredQuestQueue() {
    return new Queue(QueueConstants.USER_REGISTERED_QUEST_QUEUE, true);
  }

  @Bean
  public Binding userRegisteredQuestBinding(
      Queue userRegisteredQuestQueue, TopicExchange questifyExchange) {
    return BindingBuilder.bind(userRegisteredQuestQueue)
        .to(questifyExchange)
        .with(QueueConstants.USER_REGISTERED_ROUTING_KEY);
  }

  @Bean
  public Queue userDeletedQuestQueue() {
    return new Queue(QueueConstants.USER_DELETED_QUEST_QUEUE, true);
  }

  @Bean
  public Binding userDeletedQuestBinding(
      Queue userDeletedQuestQueue, TopicExchange questifyExchange) {
    return BindingBuilder.bind(userDeletedQuestQueue)
        .to(questifyExchange)
        .with(QueueConstants.USER_DELETED_ROUTING_KEY);
  }

  @Bean
  public Queue projectDeletedQueue() {
    return new Queue(QueueConstants.PROJECT_DELETED_QUEUE, true);
  }

  @Bean
  public Binding projectDeletedBinding(Queue projectDeletedQueue, TopicExchange questifyExchange) {
    return BindingBuilder.bind(projectDeletedQueue)
        .to(questifyExchange)
        .with(QueueConstants.PROJECT_DELETED_ROUTING_KEY);
  }

  @Bean
  public JacksonJsonMessageConverter messageConverter() {
    return new JacksonJsonMessageConverter();
  }

  @Bean
  public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
    var template = new RabbitTemplate(connectionFactory);
    template.setMessageConverter(messageConverter());
    template.setMandatory(true);
    template.setReturnsCallback(
        returned ->
            log.warn(
                "Message returned — exchange={} routingKey={} replyCode={} replyText={}",
                returned.getExchange(),
                returned.getRoutingKey(),
                returned.getReplyCode(),
                returned.getReplyText()));
    template.setConfirmCallback(
        (correlationData, ack, cause) -> {
          if (!ack) {
            log.warn("Message nacked — correlationData={} cause={}", correlationData, cause);
          }
        });
    return template;
  }
}
