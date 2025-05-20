import React, { useState } from 'react';

export type Feedback = {
  routeId: number;
  rating: number;
  comment: string;
};

type FeedbackFormProps = {
  routeId: number;
  onSubmit: (feedback: Feedback) => Promise<void>;
};

const FeedbackForm: React.FC<FeedbackFormProps> = ({ routeId, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);
    try {
      await onSubmit({ routeId, rating, comment });
      setSuccess(true);
      setRating(0);
      setComment('');
    } catch (err) {
      setError('送信に失敗しました。もう一度お試しください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-white rounded-lg shadow max-w-md mx-auto">
      <fieldset>
        <legend className="block text-sm font-medium mb-1">評価</legend>
        <div className="flex space-x-1 justify-center sm:justify-start" role="radiogroup" aria-label="ルートの評価">
          {[1, 2, 3, 4, 5].map((star) => (
            <div key={star} className="relative">
              <input
                type="radio"
                id={`rating-${star}`}
                name="rating"
                value={star}
                checked={rating === star}
                onChange={() => setRating(star)}
                disabled={isSubmitting}
                className="sr-only"
                aria-label={`${star}つ星評価`}
              />
              <label
                htmlFor={`rating-${star}`}
                className={`block text-2xl p-2 cursor-pointer ${
                  rating >= star ? 'text-yellow-400' : 'text-gray-300'
                }`}
              >
                ★
              </label>
            </div>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="feedback-comment" className="block text-sm font-medium mb-1">
          コメント
        </label>
        <textarea
          id="feedback-comment"
          name="comment"
          className="w-full border rounded p-2 text-base resize-none"
          rows={3}
          value={comment}
          onChange={e => setComment(e.target.value)}
          disabled={isSubmitting}
          placeholder="コメントを入力してください（任意）"
          aria-label="フィードバックコメント"
        />
      </div>

      {error && (
        <div className="text-red-600 text-sm text-center sm:text-left" role="alert">
          {error}
        </div>
      )}
      
      {success && (
        <div className="text-green-600 text-sm text-center sm:text-left" role="status">
          送信が完了しました！
        </div>
      )}

      <button
        type="submit"
        className="w-full bg-blue-500 text-white py-2 rounded disabled:opacity-50 text-base font-medium hover:bg-blue-600 transition-colors"
        disabled={isSubmitting || rating === 0}
        aria-label="フィードバックを送信"
      >
        {isSubmitting ? '送信中...' : 'フィードバック送信'}
      </button>
    </form>
  );
};

export default FeedbackForm; 